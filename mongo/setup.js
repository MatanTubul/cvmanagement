db = db.getSiblingDB("cvmanagment")
db.auth('root','edco123')
db.createUser(
    {
        user: "root",
        pwd: "edco123",
        roles: [ { role: "readWrite", db: "cvmanagment" } ],
        passwordDigestor : "server" //if version 4.0 else set it false
    }
);