/* 
Small script to set JWT tokens for the 3 users using postman.

These can then be used in the authorisation header for requests by setting
the auth tab to Bearer token and entering the token like this: "{{JWT_standard}}"

These are set as collection variables so they can be used in any request in
the collection e.g. For testing searches or modifying users.

Requires {{base_url}} to be set e.g. pm.setEnvironmentVariable("base_url", "http://localhost:3000/api/v1");

*/

// id = 1 - standard
pm.variables.unset("jwt_token");
var url = (pm.environment.get("base_url") + "/login/?id=1");

pm.sendRequest(url, (error, response) => {
  if (error) {
    console.log(error);
  } else {
        var jwt = response.json().jwt;
        pm.collectionVariables.set("JWT_standard", jwt)
  }
});

var url = (pm.environment.get("base_url") + "/login/?id=2");

// id = 2 - paid
pm.sendRequest(url, (error, response) => {
  if (error) {
    console.log(error);
  } else {
        var jwt = response.json().jwt;
        pm.collectionVariables.set("JWT_paid", jwt)
  }
});

var url = (pm.environment.get("base_url") + "/login/?id=3");

// id = 3 - admin
pm.sendRequest(url, (error, response) => {
  if (error) {
    console.log(error);
  } else {
        var jwt = response.json().jwt;
        pm.collectionVariables.set("JWT_admin", jwt)
  }
});
