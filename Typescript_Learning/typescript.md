

## What is TypeScript?

TypeScript is a programming language developed by Microsoft that builds on JavaScript by adding **static types**.

- It is a **superset of JavaScript** (all JS is valid TS)
- It compiles into **plain JavaScript**
- It helps catch errors **before runtime**

## Why is it useful?
Javascript doesn't have static types, it has dynamic types

In JavaScript, **types are not fixed at compile time**—they’re determined **at runtime**, and variables can change type freely.

---

##  Static vs Dynamic typing (simple idea)

###  Static typing (like TypeScript, Java, C++)

* Variable types are **checked before the code runs**
* Types are **fixed**

TypeScriptlet age: number = 25;  
age = "hello"; //  Error (wrong type)

---

###  JavaScript (dynamic typing)

* No type declarations required
* Types are decided **while the program runs**
* Variables can change type anytime

JavaScriptlet age = 25;     // number  
age = "hello";    // now it's a string  (allowed)

---

## Why this matters

Because JavaScript is dynamic:

* Errors might only show up **when you run the code**
* Bugs can be **harder to catch early**

Example:

JavaScriptfunction add(a, b) {  
  return a + b;  
}  
  
add(2, 3);      // 5  
add("2", 3);    // "23"  (unexpected!)

JavaScript doesn’t complain—it just behaves differently.

---



- JavaScript **does have types** (string, number, boolean, etc.)
- BUT:
    - You **don’t declare them explicitly**
    - The language **doesn’t enforce them ahead of time**

That’s why it’s called **dynamically typed**

---

##  Where TypeScript comes in

TypeScript adds static typing _on top of JavaScript_:

TypeScriptfunction add(a: number, b: number) {  
  return a + b;  
}  
  
add("2", 3); // NO: Caught BEFORE running

---

## Easy analogy

* **JavaScript** = “I’ll figure it out as I go”
* **TypeScript** = “Tell me the plan first, I’ll check it”

---

## Working with Typescript

---


### Create a file:

```
index.ts```

### Write code:

```
let message: string = "Hello TypeScript";
console.log(message);```

### Compile to JavaScript:

```
tsc index.ts```

### Run it:

```
node index.js```

---

## Syntax

##  Basic Types

```
let age: number = 25;
let name: string = "John";
let isActive: boolean = true;```

---

##  Arrays

```
let numbers: number[] = [1, 2, 3];
let names: string[] = ["Alice", "Bob"];```

---

## Functions

```
function add(a: number, b: number): number {
  return a + b;
}```

---

##  Objects

```
let user: { name: string; age: number } = {
  name: "Alice",
  age: 30
};```

---

##  Interfaces (recommended for objects)

```
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "Alice",
  age: 30
};```

---

##  Optional Properties

```
interface User {
  name: string;
  age?: number;
}```

---

##  Union Types

```
let id: number | string;

id = 123;
id = "abc";```

---

##  Type Inference

```
let x = 10; // inferred as number```

---

##  Type Aliases

```
type ID = number | string;

let userId: ID = 123;```

---

##  Functions with Optional / Default Params

```
function greet(name: string = "Guest"): string {
  return "Hello " + name;
}```

---

##  Arrow Functions

```
const add = (a: number, b: number): number => a + b;```

---

##  Enums

```
enum Role {
  Admin,
  User,
  Guest
}

let userRole: Role = Role.Admin;```

---

##  Any (avoid if possible)

```
let data: any = "hello";
data = 42;```

---

##  Unknown (safer alternative to any)

```
let value: unknown = "hello";```

---

##  Type Assertions

```
let value: unknown = "hello";
let strLength: number = (value as string).length;```

---

##  tsconfig.json (Project Config)

Create one with:

```
tsc --init```

Key settings:

```
{
  "compilerOptions": {
    "target": "ES6",
    "strict": true,
    "outDir": "./dist"
  }
}```

---

