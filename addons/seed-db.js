db = db.getSiblingDB('docker-db');

db.createUser({
    user: 'devuser',
    pwd: 'devpassword',
    roles: [
        {
            role: 'readWrite',
            db: 'docker-db',
        },
    ],
});

  db.createCollection('api_keys');
  db.createCollection('roles');
  db.createCollection('classes');
  db.createCollection('users');

if (db.api_keys.countDocuments() === 0) {
  db.api_keys.insertOne({
    key: 'haGv9z3ZNTwBfHBszfOjeu8q3ZfARGcN',
    permissions: ['GENERAL'],
    comments: ['To be used by the hps vercel'],
    version: 1,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),  
  });
}

    if (db.roles.countDocuments() === 0) {
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
    }
   
   if (db.users.countDocuments() === 0) {
     db.users.insert({
      name: 'Ateeb Ahmed',
      father_name: 'Taeed Ahmed',
      email: 'admin@admin.hps.com',
      gender:'male',
      cnic: '35201-8452114-7',
      cnic_issued_date: '2019-11-11',
      cnic_expiry_date: '2029-03-02',
      username: 'admin',
      password: '$2b$10$smO9HlI9N0mz9Qex7BwY4ewJP500QGVZgpAav6tVE9d10vsmYCcWi', 
      roles: db.roles
      .find({})
      .toArray()
      .map((role) => role._id),
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
   }
   );
   }
   
   if(db.classes.countDocuments() === 0) {
    db.classes.insertMany([
 
  {
    className: 'Nursery',
    fee: 1080,
    section: ['A', 'B', 'C', 'D', 'E'],
  },
   {
    className: 'Prep',
    fee: 1230,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '1st',
    fee: 1280,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '2nd',
    fee: 1330,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '3rd',
    fee: 1380,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '4th',
    fee: 1430,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '5th',
    fee: 1480,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '6th',
    fee: 1680,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '7th',
    fee: 1750,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '8th',
    fee: 1900,
    section: ['A', 'B', 'C', 'D'],
  },
  {
    className: '9th',
    fee: 2300,
    section: ['A', 'B'],
  },
  {
    className: '10th',
    fee: 2600,
    section: ['A', 'B'],
  },
]
);
   }