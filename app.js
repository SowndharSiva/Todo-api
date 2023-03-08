const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
const convertObjectIntoTodo = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};
const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB ERROR:${e}`);
    process.exit(1);
  }
};

app.get("/todos/", async (request, response) => {
  const hasPriorityAndStatus = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  let getQuery = "";
  let { search_q = "", status, priority} = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQuery = `SELECT * FROM todo 
            WHERE todo LIKE "%${search_q}%" AND priority ="${priority}" AND status="${status}";`;
      break;
    case hasStatus(request.query):
      getQuery = `SELECT * FROM todo
            WHERE todo LIKE "%${search_q}%" AND status="${status}";`;
      break;
    case hasPriority(request.priority):
      getQuery = `SELECT * FROM todo 
            WHERE  priority="${priority}";`;
      break;
    default:
      getQuery = `SELECT * FROM todo
            WHERE todo LIKE "%${search_q}%";`;
  }
  const getDetails = await db.all(getQuery);
  response.send(getDetails);
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo 
    WHERE id=${todoId};`;
  const getDetails = await db.get(getQuery);
  response.send(getDetails);
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `INSERT INTO todo (id,todo,priority,status)
    VALUES (${id},"${todo}","${priority}","${status}");`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});
app.put("/todos/:todoId/", async (request, response) => {
  let updateEl = "";
  switch (true) {
    case request.body.status !== undefined:
      updateEl = "Status";
      break;
    case request.body.priority !== undefined:
      updateEl = "Priority";
      break;
    default:
      updateEl = "Todo";
  }
  const { todoId } = request.params;
  const previousTodoQuery = `SELECT * FROM todo 
    WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateQuery = `UPDATE todo 
    SET todo="${todo}",
    priority="${priority}",
    status="${status}"
    WHERE id=${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateEl} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo 
    WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
InitializeDBAndServer();
module.exports = app;
