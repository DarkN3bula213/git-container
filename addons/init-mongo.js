function seed(dbName, user, password) {
  db = db.getSiblingDB(dbName);
  db.createUser({
    user: user,
    pwd: password,
    roles: [{ role: 'readWrite', db: dbName }],
  });

  db.createCollection('api_keys');
  db.createCollection('roles');
  db.createCollection('classes');

  db.classes.insertMany([
  {
    "className": "Prep",
    "fee": 1050,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "Nursery",
    "fee": 1000,
    "section": ["A", "B", "C", "D", "E"]
  },
  {
    "className": "1st",
    "fee": 1100,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "2nd",
    "fee": 1150,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "3rd",
    "fee": 1200,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "4th",
    "fee": 1250,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "5th",
    "fee": 1300,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "6th",
    "fee": 1500,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "7th",
    "fee": 1550,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "8th",
    "fee": 1700,
    "section": ["A", "B", "C", "D"]
  },
  {
    "className": "9th",
    "fee": 2000,
    "section": ["A", "B"]
  },
  {
    "className": "10th",
    "fee": 2300,
    "section": ["A", "B"]
  }
]
);

  db.api_keys.insertOne({
    key: 'haGv9z3ZNTwBfHBszfOjeu8q3ZfARGcN',
    permissions: ['GENERAL'],
    comments: ['To be used by the hps vercel'],
    version: 1,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),  
  });

  db.roles.insertMany([
    {
      code: 'HPS',
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: 'ADMIN',
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  db.users.insert({
    name: 'Admin',
    email: 'admin@xyz.com',
    password: '$2a$10$psWmSrmtyZYvtIt/FuJL1OLqsK3iR1fZz5.wUYFuSNkkt.EOX9mLa', // hash of password: changeit
    roles: db.roles
      .find({})
      .toArray()
      .map((role) => role._id),
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  
  db.users.insertMany([
  {
    "username": "fazal22",
    "email": "fazal@admin.hps.com",
    "name": "Khawaja Fazal Ur Rehman",
    "father_name": "Khawaja Abdul Rasheed Rathore",
    "gender": "male",
    "cnic": "34603-6721888-7",
    "dob": "1974-11-22",
    "cnic_issued_date": "2021-03-02",
    "cnic_expiry_date": "2031-03-02",
    "password": "temp1234"
  },
  {
    "username": "imran51",
    "email": "imran@admin.hps.com",
    "name": "Imran Shehzad",
    "father_name": "Abdul Rasheed",
    "gender": "male",
    "cnic": "34603-2154152-7",
    "dob": "1976-05-01",
    "cnic_issued_date": "2016-11-11",
    "cnic_expiry_date": "2026-11-11",
    "password": "temp1234"
  }
]
);
}

seed('blogs-db', 'blogs-db-user', 'changeit');
seed('blogs-test-db', 'blogs-test-db-user', 'changeit');
