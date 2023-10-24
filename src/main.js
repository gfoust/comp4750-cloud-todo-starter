import { deleteTask, getAllTasks, getTask, getTasksCompleted, putTask } from "./db.js";
import { argv } from "process";

/*==========================================================
 * Helpers
 */
async function lookupTask(userId, description) {
  if (description.match(/^\d+$/)) {
    const tasks = await getAllTasks(userId);
    return tasks[Number(description) - 1];
  }
  else {
    return getTask(userId, description);
  }
}

/*--------------------------------------------------------*/
function printTasks(tasks) {
  if (tasks.length) {
    for (let task of tasks) {
      let checkbox;
      if (task.completed) {
        checkbox = '[✓] ';
      }
      else {
        checkbox = '[ ] ';
      }
      console.log(checkbox + task.description);
    }
  }
  else {
    console.log('No tasks found')
  }
}


/*==========================================================
 * Commands
 */
async function getCommand(userId, description) {
  let tasks;
  if (description) {
    let task = await lookupTask(userId, description);
    tasks = task ? [task] : [];
  }
  else {
    tasks = await getAllTasks(userId);
  }

  printTasks(tasks);
}

/*--------------------------------------------------------*/
async function remainCommand(userId) {
  const tasks = await getTasksCompleted(userId, false);

  printTasks(tasks);
}

/*--------------------------------------------------------*/
async function addCommand(userId, description) {
  if (await getTask(userId, description)) {
    throw new Error("Task already exists!");
  }

  const task = {
    userId,
    taskId: new Date().getTime(),
    description,
    completed: false
  };

  await putTask(task);
}

/*--------------------------------------------------------*/
async function checkCommand(userId, description) {
  const task = await lookupTask(userId, description);

  if (task) {
    task.completed = !task.completed;
    await putTask(task);
    console.log(`Task changed to ${task.completed ? '' : 'not '}completed`);
  }
  else {
    console.log("Task not found");
  }
}

/*--------------------------------------------------------*/
async function clearCommand(user) {
  let tasks = await getTasksCompleted(user, true);
  tasks.map(deleteTask);
}

/*--------------------------------------------------------*/
function helpCommand() {
  console.log("Usage: node todo command params...");
  console.log("Commands:");
  console.log("  get user          - view all tasks");
  console.log("  get user task     - view specific task");
  console.log("  remain user       - get all tasks that have not been completed")
  console.log("  add user task     - add new task");
  console.log("  check user task   - toggle complete status for task");
  console.log("  clear user        - clear all completed tasks");
}

/*==========================================================
 * Main
 */
try {
  if (argv.length < 3) {
    throw new Error(`Usage: node todo command params...\nUse 'help' command for more information`);
  }

  const command = argv[2];

  if (command == "get") {
    if (argv.length != 4 && argv.length != 5) {
      throw new Error(`Usage: node todo get user [task]`);
    }
    await getCommand(argv[3], argv[4]);
  }
  else if (command == "remain") {
    if (argv.length != 4) {
      throw new Error(`Usage: node todo remain user`);
    }
    await remainCommand(argv[3]);
  }
  else if (command == "add") {
    if (argv.length != 5) {
      throw new Error(`Usage: node todo add user task`);
    }
    await addCommand(argv[3], argv[4]);
  }
  else if (command == "check") {
    if (argv.length != 5) {
      throw new Error(`Usage: node todo check user task`);
    }
    await checkCommand(argv[3], argv[4]);
  }
  else if (command == "clear") {
    if (argv.length != 4) {
      throw new Error(`Usage: node todo clear user`);
    }
    await clearCommand(argv[3]);
  }
  else if (command == "help") {
    helpCommand();
  }
  else {
    throw new Error(`Unknown command: "${command}"`);
  }
}
catch (err) {
  console.log(err.message);
}
