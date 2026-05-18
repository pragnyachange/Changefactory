//rock paper scissors game with user interaction


let choices = ["rock", "paper", "scissors"];
let user = prompt("Choose rock, paper, or scissors");
let computer = choices[Math.floor(Math.random() * 3)];

console.log("Computer:", computer);

if (user === computer) {
  console.log("Draw!");
} else if (
  (user === "rock" && computer === "scissors") ||
  (user === "paper" && computer === "rock") ||
  (user === "scissors" && computer === "paper")
) {
  console.log("You win!");
} else {
  console.log("You lose!");
}