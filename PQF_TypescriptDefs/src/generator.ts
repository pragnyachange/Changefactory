import fs from 'fs';
import parse from 'xml-parser';

class IncompleteDefinitionException extends Error {}

class DataContract {
    module = '';
    typeName = '';
    base: string | undefined;
    members: Member[] = [];
    description: string | undefined;

    static fromXML(contract: parse.Node, debug = false): DataContract {
        const inst = new DataContract();
        if (debug) {
            console.log(contract.attributes['module'], contract.attributes['name'], !(contract.attributes['module'] && contract.attributes['name']));
        }
        if (!(contract.attributes['module'] && contract.attributes['name'])) {
            throw new IncompleteDefinitionException();
        }

        inst.module = contract.attributes['module'];
        inst.typeName = contract.attributes['name'];
        inst.base = ((base) => {
            const datacontract = base?.attributes['datacontract'];
            const mod = base?.attributes['module'];
            if (mod != undefined) {
                return `${mod}.${datacontract}`;
            } else {
                return datacontract;
            }
        })(contract.children?.find(ch => ch.name == 'base'));
        inst.description = contract.children?.find(ch => ch.name == 'description')?.content;

        const members = contract.children?.filter(ch => ch.name == 'member');
        const typeMembers: Member[] = [];
        for (const member of members) {
            const type = member.children.find(ch => ch.name == 'simpleType' || ch.name == 'complexType');
            let typeStr: string;
            let isArray = false;
            let isOptional = false;
            if (type?.name == 'complexType') {
                if (type.attributes['module'] == undefined) {
                    typeStr = inst.module + "." + type.attributes['datacontract'];
                } else {
                    typeStr = type.attributes['module'] + "." + type.attributes['datacontract'];
                }
                isArray = type.attributes['occurence'] == 'array';
            } else {
                typeStr = type?.attributes['type'] || 'string';
                isOptional = typeStr.includes('?');
                typeStr = convertType(typeStr);
            }
            const description = type?.attributes['description'];

            if (member.attributes['name']) {
                typeMembers.push({
                    name: member.attributes['name'],
                    type: typeStr,
                    isArray: isArray,
                    isOptional: isOptional,
                    description
                });
            } else {
                console.warn('Member type incomplete', member);
            }
        }

        inst.members = typeMembers;

        return inst;
    }

    generateDataContract(): string {
        const strbldr = [];
        /* Build interface */
        strbldr.push(`namespace ${this.module} {\n`);

        if (this.description) {
            strbldr.push(`/**\n * @description ${this.description}\n */\n`);
        }
        if (this.members.length > 0) {
            if (this.base != undefined) {
                strbldr.push(`interface ${this.typeName} extends ${this.base} {\n`)
            } else {
                strbldr.push(`interface ${this.typeName} {\n`)
            }

            for (const tp of this.members) {
                strbldr.push(`    ${tp.name}${tp.isOptional ? '?' : ''}: ${tp.type}${tp.isArray ? '[]' : ''};\n`);
            }

            strbldr.push("}\n");
        } else {
            strbldr.push(`type ${this.typeName} = unknown;\n`)
        }

        strbldr.push("}\n\n");

        return strbldr.join('');
    }
}


class InvalidSecurityException extends Error {
    constructor(public endpointName: string, public securityLevel: string) {
        super();
    }
}

class EndpointDefinition {
    module = '';
    name = '';
    params: Member[] = [];
    returnType: Member | undefined;
    description: string | undefined;

    static fromXML(endpoint: parse.Node): EndpointDefinition {
        const inst = new EndpointDefinition();
        if (!endpoint.attributes['module'] || !endpoint.attributes['name']) {
            throw new IncompleteDefinitionException();
        }

        inst.module = endpoint.attributes['module'];
        inst.name = endpoint.attributes['name'];
        const securityLevel = endpoint.attributes['securitylevel'];

        if (securityLevel != undefined) {
            throw new InvalidSecurityException(inst.name, securityLevel);
        }

        const urlNode = endpoint.children.find(ch => ch.name == 'url');
        if (urlNode == undefined) {
            throw new IncompleteDefinitionException();
        }
        inst.description = endpoint.children?.find(ch => ch.name == 'description')?.content;
        inst.params = urlNode.children.filter(p => {
            return p.name == 'optional'
                || p.name == 'variable';
        }).map((para): Member => {
            const type = convertType(para.attributes['type'] || 'string');
            const isOptional = para.name == 'optional';
            const name = para.content ?? 'ERR';
            const description = para.attributes['description'];

            return {
                name: name,
                type,
                isOptional,
                isArray: false,
                description
            }
        });

        const obj = endpoint.children.find(a => a.name == 'send');
        if (obj) {
            const jsonObj = obj.children.find(ch => ch.name == 'json');
            const mod = jsonObj?.attributes['module'];
            const type = convertType(jsonObj?.attributes['datacontract']);
            const isArray = jsonObj?.attributes['occurrence'] == 'array';
            const description = jsonObj?.attributes['description'];

            inst.params.push({
                name: 'obj',
                type: `${mod == undefined ? '' : mod + '.'}${type}`,
                isArray,
                isOptional: false,
                description
            });
        }


        const receive = endpoint.children.find(a => a.name == 'receive');
        if (receive) {
            const jsonObj = receive.children.find(ch => ch.name == 'json');
            const raw = receive.children.find(ch => ch.name == 'raw');

            if (jsonObj != undefined) {
                const mod = jsonObj?.attributes['module'];
                const type = jsonObj?.attributes['datacontract'];
                const typeActual = `${mod == undefined ? inst.module : mod}.${type}`;
                const isArray = jsonObj?.attributes['occurrence'] == 'array';
                const description = jsonObj?.attributes['description'];

                inst.returnType = {
                    name: 'ignored',
                    type: typeActual,
                    isArray,
                    isOptional: false,
                    description
                };
            } else if (raw != undefined) {
                inst.returnType = {
                    name: 'ignored',
                    type: 'unknown',
                    isArray: false,
                    isOptional: false,
                    description: undefined
                }
            }
        }

        return inst;
    }

    generateEndpoint(): string {
        const strbldr = [];
        strbldr.push(`namespace ${this.module} {\n`);

        const paramsStr = this.params.map(p => {
            return p.name + (p.isOptional ? '?' : '') + ":" + p.type + (p.isArray ? '[]' : '')
        }).join(', ');
        if (this.returnType != null) {
            strbldr.push(`    export function ${this.name}(${paramsStr}): ${this.returnType.type}${this.returnType.isArray ? '[]' : ''};\n`);
        } else {
            strbldr.push(`    export function ${this.name}(${paramsStr});\n`);
        }

        strbldr.push(`}\n`);
        return strbldr.join('');
    }
}

interface Member {
    name: string;
    type: string;
    isArray: boolean;
    isOptional: boolean;
    description: string | undefined;
}

function convertType(typeStr: string | undefined): string {
    if (typeStr == undefined) {
        typeStr = 'unknown';
    } else {
        switch (typeStr) {
            case 'double?':
            case 'double':
            case 'int?':
            case 'int':
            case 'long?':
            case 'long':
            case 'fraction?':
            case 'fraction':
                typeStr = 'number';
                break;
            case 'datetime':
                typeStr = 'Date';
                break;
            case 'date':
            case 'color':
            case 'duration':
                typeStr = 'string';
                break;
            case 'boolean?':
                typeStr = 'boolean';
                break;
            default:
            //
        }
    }
    return typeStr;
}

function generateTypeDefinitions(contents: string, debugLog = false): string {
    const doc = parse(contents);

    const datacontracts = doc.root.children?.find(item => item.name == 'datacontracts');
    const endpoints = doc.root.children?.find(item => item.name == 'endpoints');

    if (datacontracts && endpoints) {
        const strbldr: string[] = [];
        strbldr.push('declare namespace Pqf {\n');

        for (const contract of datacontracts['children']) {
            /* Collect type information  */
            try {
                const contr = DataContract.fromXML(contract, debugLog);
                strbldr.push(contr.generateDataContract());
            } catch {
                console.warn(`Some parts of XML (${JSON.stringify(contract)}) could not be parsed, therefore skipping code generation`);
            }
        }

        for (const endpoint of endpoints.children) {
            try {
                const ret = EndpointDefinition.fromXML(endpoint);
                strbldr.push(ret.generateEndpoint());
            } catch (e) {
                if (e instanceof IncompleteDefinitionException) {
                    console.warn(`Some parts of XML (${JSON.stringify(endpoint)}) could not be parsed, therefore skipping code generation`);
                } else if (e instanceof InvalidSecurityException && debugLog) {
                    console.log(`${e.endpointName} has security lebel ${e.securityLevel}`);
                }
            }
        }

        strbldr.push('}\n'); /* export namespace Pqf */

        return strbldr.join('');
    } else {
        throw Error('no datacontracts or endpoint sections found');
    }

}

function main(args: string[]) {
    if (args.length >= 4) {
        const input = args[2] ?? '';
        const output = args[3] ?? '';
        const contents = fs.readFileSync(input, 'utf-8');
        fs.writeFileSync(output, generateTypeDefinitions(contents));
    } else {
        console.warn("usage: node .../generator.js input.xml output.d.ts");
    }
}

main(process.argv);
