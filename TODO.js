const readline = require("readline");

// create an interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let todos = [];

//show menu 
// \n is for new line
function showMenu() {
  console.log("\n--- TODO APP ---");
  console.log("1. Add task");
  console.log("2. View tasks");
  console.log("3. Delete task");
  console.log("4. Exit");

  rl.question("Choose an option: ", handleInput);
}

function handleInput(option) {
  switch (option.trim()) {
    case "1":
      rl.question("Enter task: ", (task) => {
        todos.push(task);
        console.log("Task added!");
        showMenu();
      });
      break;

    case "2":
      console.log("\n Your Tasks:");
      if (todos.length === 0) {
        console.log("No tasks yet.");
      } else {
        todos.forEach((t, i) => console.log(`${i + 1}. ${t}`));
      }
      showMenu();
      break;

    case "3":
      rl.question("Enter task number to delete: ", (num) => {
        const index = parseInt(num) - 1;
        if (todos[index]) {
          console.log(`Removed: ${todos[index]}`);
          todos.splice(index, 1);
        } else {
          console.log("Invalid number");
        }
        showMenu();
      });
      break;

    case "4":
      console.log("Exited TODO APP");
      rl.close();
      break;

    default:
      console.log("Invalid option");
      showMenu();
  }
}

showMenu();