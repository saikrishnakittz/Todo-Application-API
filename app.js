const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let database = null;

const initialiseDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initialiseDbAndServer();

const checkRequestQuaries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    const priorityStatus = ["HIGH", "MEDIUM", "LOW"];
    const priorityInArray = priorityStatus.includes(priority);
    if (priorityInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryInArray = categoryArray.includes(category);
    if (categoryInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (date !== undefined) {
    const isDateValid = isValid(new Date(date));
    if (isValidDate === false) {
      response.send(400);
      response.send("Invalid Due Date");
    } else {
      next();
    }
  }
};

const checkRequestBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    const priorityStatus = ["HIGH", "MEDIUM", "LOW"];
    const priorityInArray = priorityStatus.includes(priority);
    if (priorityInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryInArray = categoryArray.includes(category);
    if (categoryInArray === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    const isDateValid = isValid(new Date(date));
    if (isValidDate === false) {
      response.send(400);
      response.send("Invalid Due Date");
    } else {
      next();
    }
  }
};
//API 1
app.get("/todos/", checkRequestQuaries, async (request, response) => {
  const {
    search_q = "",
    status = "",
    priority = "",
    category = "",
  } = request.query;
  console.log(search_q, status, priority, category);
  const getTodoQuery = `
            SELECT
                id,
                todo,
                priority,
                status,
                category,
                due_date AS dueDate
            FROM todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status LIKE '${status}' AND priority LIKE '${priority}'
                category LIKE '${category}'`;
  const todoArray = await database.all(getTodoQuery);
  response.send(todoArray);
});
//API 2
app.get("todos/:todoId/", checkRequestQuaries, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
            SELECT
                id,
                todo,
                priority,
                status,
                category,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                id=${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});
//API 3
app.get("/agenda/", checkRequestQuaries, async (request, response) => {
  const { date } = request.body;
  // console.log(date, "a");
  const selectDuaDateQuery = `
        SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM 
            todo
        WHERE 
            due_date = '${date}'
        ;`;

  const todosArray = await database.all(selectDuaDateQuery);

  if (todosArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todosArray);
  }
});
//API 4
app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;

  const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (
                ${id},
               '${todo}',
               '${priority}',
               '${status}',
               '${category}',
               '${dueDate}'
            )
        ;`;

  const createUser = await database.run(addTodoQuery);
  console.log(createUser);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;

  const { priority, todo, status, category, dueDate } = request.body;

  let updateTodoQuery = null;

  //console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await database.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await database.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await database.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await database.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await database.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});
//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
