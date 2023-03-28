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
  const { todoId } = request.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryInArray = categoryArray.includes(category);
    if (categoryInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (priority !== undefined) {
    const priorityStatus = ["HIGH", "MEDIUM", "LOW"];
    const priorityInArray = priorityStatus.includes(priority);
    if (priorityInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formatedDate = format(new Date(date), "yyyy-mm-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
    request.todoId = todoId;
    request.search_q = search_q;
    next();
  }
};

const checkRequestBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }

    if (priority !== undefined) {
      const priorityArray = ["HIGH", "MEDIUM", "LOW"];
      const priorityIsInArray = priorityArray.includes(priority);
      if (priorityIsInArray === true) {
        request.priority = priority;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
    }
    if (status !== undefined) {
      const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
      const statusIsInArray = statusArray.includes(status);
      if (statusIsInArray === true) {
        request.status = status;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
    }

    if (dueDate !== undefined) {
      try {
        const myDate = new Date(dueDate);
        const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
        //console.log(formatedDate);
        const result = toDate(new Date(formatedDate));
        const isValidDate = isValid(result);
        // console.log(isValidDate);
        // console.log(isValidDate);
        if (isValidDate === true) {
          request.dueDate = formatedDate;
        } else {
          response.status(400);
          response.send("Invalid Due Date");
          return;
        }
      } catch (e) {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    }
    request.todo = todo;
    request.id = id;

    request.todoId = todoId;

    next();
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
  // console.log(search_q, status, priority, category);
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
