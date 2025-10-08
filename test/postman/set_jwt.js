/* 
Small script to set JWT tokens for the 3 users using postman.

These can then be used in the authorisation header for requests by setting
the auth tab to Bearer token and entering the token like this: "{{JWT_standard}}"

These are set as Postman environment variables so they can be used in any request in
the collection e.g. For testing searches or modifying users.

Requires {{base_url}} to be set e.g. pm.environment.set("base_url", "http://localhost:3000/api/v1");

*/


function setJWT(user) {
  const { id, name } = user;
  var url = `${pm.environment.get("base_url")}/login/?id=${id}`;

  pm.sendRequest(url, (error, response) => {
    if (error) {
      console.log(error);
    } else {
      var jwt = response.json().jwt;
      pm.environment.set(`JWT_${name}`, jwt);

      // Set jwt_token in environment
      if (id === 3) {
        pm.environment.set("jwt_token", jwt);
      }
    }
  });
}

const users = [
  { id: 1, name: "standard" },
  { id: 2, name: "paid" },
  { id: 3, name: "admin" }
];

for (const user of users) {
  setJWT(user);
}
