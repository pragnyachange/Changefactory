/**
 * To compile:
 *   tsc practice.ts
 *
 * To run: (go into folder Typescript Learning first)
 *   node practice.js
 *
 * Or run directly with ts-node:
 *   ts-node practice.ts
 *

// This file contains various TypeScript exercises to practice basic concepts.

// creating variables 

let myName: string = "Alice";
let myAge: number = 25;
let learningTypeScript: boolean = true;

//to check if done correctly
console.log("Creating Variables");
console.log("Name:", myName);
console.log("Age:", myAge);
console.log("Learning TypeScript:", learningTypeScript);
console.log("-----------------------------------");

// Hello name function
function greet(name: string): string {
  return `Hello, ${name}`;
}

console.log("Greeting Function");
console.log(greet("Sam"));
console.log("-----------------------------------");

// Add 2 numbers
function addNumbers(a: number, b: number): number {
  return a + b;
}
console.log("Addition Function");
console.log(addNumbers(5, 10));
console.log("-----------------------------------");

// Creating an array of numbers and print each value -> for each loop 
let numbers: number[] = [10, 20, 30, 40, 50];

console.log("Exercise 4");

// Loop through the array one item at a time
for (const num of numbers) {
  console.log("Number:", num);
}
console.log("-----------------------------------");

// Object types , multiple properties 

type User = {
  name: string;
  age: number;
};

const user1: User = {
  name: "Maya",
  age: 22,
};

console.log("User Object");
console.log("User name:", user1.name);
console.log("User age:", user1.age);
console.log("-----------------------------------");

// Interface for Product 

interface Product {
  name: string;
  price: number;
  description?: string; // Optional property with ?
}

const laptop: Product = {
  name: "Laptop",
  price: 999,
  description: "A fast laptop for coding",
};

const mouse: Product = {
  name: "Mouse",
  price: 25,
  
};

console.log("Product Interface");
console.log(laptop);
console.log(mouse);
console.log("-----------------------------------");

//Union types for multiple types of values

function displayValue(value: string | number): void {
    // value can be either a string or a number, we can handle both cases
  console.log("Value:", value);
}

console.log("Union Types");
displayValue("Hello");
displayValue(123);  

//Function with object parameter
// Function that takes a person object and returns a sentence about that person
// variante 1 
type Person = {
  name: string;
  age: number;
};

function describePerson(person: Person): string {
  return `${person.name} is ${person.age} years old.`;
}

const person1: Person = {
  name: "Leo",
  age: 30,
};

console.log("Describe Person Function");
console.log(describePerson(person1));
console.log("-----------------------------------");




// Further Exercises
/* =========================================================
   EXERCISE 1: BOOLEAN RETURN VALUE
   Task:
   Write a function called isAdult that returns true
   if age is 18 or older, otherwise false.
   ========================================================= */

function isAdult(age: number): boolean {
  return age >= 18;
}

console.log("Exercise 1");
console.log(isAdult(20)); // true
console.log(isAdult(15)); // false
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 2: ARRAY OF OBJECTS
   Task:
   Create an array of students and print their names.
   ========================================================= */


type Student = {
  name: string;
  grade: number;
};

const students: Student[] = [
  { name: "Anna", grade: 90 },
  { name: "Ben", grade: 85 },
  { name: "Cara", grade: 95 },
];

console.log("Exercise 2");

for (const student of students) {
  console.log("Student name:", student.name);
}
console.log("-----------------------------------");


/* ========================================================
   EXERCISE 3: MULTIPLY FUNCTION
   Task:
   Write a function that multiplies two numbers.
   ========================================================= */


function multiply(a: number, b: number): number {
  return a * b;
}

console.log("Exercise 3");
console.log(multiply(4, 6)); // 24
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 4: TYPE ALIAS WITH UNION OF STRINGS
   Task:
   Create a type called Status that can only be:
   - "success"
   - "error"
   - "loading"
   ========================================================= */


type Status = "success" | "error" | "loading";

let currentStatus: Status = "loading";
console.log("Exercise 4");
console.log("Current status:", currentStatus);

currentStatus = "success";
console.log("Updated status:", currentStatus);
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 5: ENUM
   Task:
   Create an enum called Direction with:
   - Up
   - Down
   - Left
   - Right
   ========================================================= */


enum Direction {
  Up,
  Down,
  Left,
  Right,
}

let moveDirection: Direction = Direction.Up;

console.log("Exercise 5");
console.log("Direction enum value:", moveDirection);
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 6: SQUARE A NUMBER
   Task:
   Write a function called square that returns
   the square of a number.
   ========================================================= */


function square(num: number): number {
  return num * num;
}

console.log("Exercise 6");
console.log(square(5)); // 25
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 7: TOTAL OF ARRAY VALUES
   Task:
   Create an array of 5 numbers and print their total.
   ========================================================= */


const values: number[] = [1, 2, 3, 4, 5];
let total: number = 0;

// Add each number to total
for (const value of values) {
  total += value;
}

console.log("Exercise 7");
console.log("Total:", total); // 15
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 8: CAR TYPE AND OBJECT
   Task:
   Create a type called Car with:
   - brand
   - model
   - year

   Then create one car object.
   ========================================================= */


type Car = {
  brand: string;
  model: string;
  year: number;
};

const car1: Car = {
  brand: "Toyota",
  model: "Corolla",
  year: 2022,
};

console.log("Exercise 8");
console.log(car1);
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 9: FUNCTION USING A CAR OBJECT
   Task:
   Create a function that takes a Car object and returns
   a sentence about the car.
   ========================================================= */


function describeCar(car: Car): string {
  return `${car.brand} ${car.model} was made in ${car.year}.`;
}

console.log("Exercise 9");
console.log(describeCar(car1));
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 10: DEFAULT PARAMETERS
   Task:
   Write a function that greets a user. If no name is given,
   use "Guest" as the default.
   ========================================================= */


function greetUser(name: string = "Guest"): string {
  return `Welcome, ${name}!`;
}

console.log("Exercise 10");
console.log(greetUser());
console.log(greetUser("Nina"));
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 11: ARROW FUNCTION
   Task:
   Rewrite a simple add function using arrow function syntax.
   ========================================================= */


const addWithArrow = (a: number, b: number): number => {
  return a + b;
};

console.log("Exercise 11");
console.log(addWithArrow(2, 8)); // 10
console.log("-----------------------------------");


/* =========================================================
   EXERCISE 12: SIMPLE STRETCH GOAL WITH GENERICS
   Task:
   Write a generic function called identity that returns
   the same value it receives.
   ========================================================= */


function identity<T>(value: T): T {
  // T means "any type", but the same type must go in and come out
  return value;
}

console.log("Exercise 12");
console.log(identity<string>("Hello"));
console.log(identity<number>(123));
console.log(identity<boolean>(true));
console.log("-----------------------------------");
