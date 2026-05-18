
//calculator used as node calculator.js num op num 

const args = process.argv.slice(2);

if (args.length !== 3) {
    //debugging 
    console.log('Usage: node calculator.js <num1> <operator> <num2>');
    console.log('Operators: +, -, *, /');
    process.exit(1);
}

const num1 = parseFloat(args[0]);
const op = args[1];
const num2 = parseFloat(args[2]);

if (isNaN(num1) || isNaN(num2)) {
    console.log('Error: Invalid numbers');
    process.exit(1);
}

//switch block
let result;
switch (op) {
    case '+':
        result = num1 + num2;
        break;
    case '-':
        result = num1 - num2;
        break;
    case '*':
        result = num1 * num2;
        break;
    //edge cases
    case '/':
        if (num2 === 0) {
            console.log('Error: Division by zero');
            process.exit(1);
        }
        result = num1 / num2;
        break;
    default:
        console.log('Error: Invalid operator. Use +, -, *, /');
        process.exit(1);
}

console.log(`${num1} ${op} ${num2} = ${result}`);