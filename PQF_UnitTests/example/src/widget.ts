import { example } from './example';
import type { JTFMetaCategory, JTFMetaColumn, JsonTableFormat } from './jtf';


const columnCategories: JTFMetaCategory[] = [
    {
        id: 'cat1',
        label: {
            de: 'Kategorie 1',
            en: 'Category 1'
        }
    },
];

const columns: JTFMetaColumn[] = [
    {
        "catid": "cat1",
        "id": "example",
        "label": {
            "en": "Example",
            "de": "Beispiel"
        },
        "type": "string",
        "options": {
            "resizable": true,
            "width": 120
        },
        "style": {
            "backgroundColor": "#f00"
        }
    },
    {
        catid: "cat1",
        id: "example2",
        label: {"de": "Test", "en": "Test"},
        type: 'number',
    }
];


function exampleWidget(pqfProjectId: string): JsonTableFormat {
    const project = Pqf.pm.getProject(pqfProjectId);

    const data = [
        [
            project.name,
            Math.random()
        ]
    ];
    return {
        "id": "JFT-TS-EXAMPLE",
        "code": { "de": "beispiel", "en": "example" },
        "name": { "de": "Tabellenbeispiel", "en": "Table example" },
        "data": data,
        "description": {
            "en": "Description",
            "de": "Beschreibung"
        },
        "meta": {
            "options": {
                "adaptiveColumnWidths": true,
                "showHeader": true,
            },
            "categories": columnCategories,
            "columns": columns
        },
        "mimeType": "application/x.pqf.table.json",
        "hints": [
            {
                "type": "info",
                "label": "Project",
                "text": { "de": example(), "en": "Example" }
            }
        ],
        "type": "JsonTable"
    };
}

const pqfProjectId = client.selectedObject.id;

exampleWidget(pqfProjectId);
