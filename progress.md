
# Progress updater

## MVP 

#### Users

1. Ensure seeding add the admin [+]
2. Register should work
3. Login should work
4. Role may assigned 
5. Role middleware to work 
6. Auth middleware to work
7. User may update info
8. User may change password

# ssh command

```bash 
scp .env root@159.65.149.28:/var/www/dropts/ver2/app
ssh root@159.65.149.28
cd /var/www/dropts/
git clone https://github.com/DarkN3bula213/git-container.git
rm -r app
mv git-container app
scp .env root@159.65.149.28:/var/www/dropts/ver2/app
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)
docker-compose up
```
rsync -av --delete /var/www/dropts/ver3/appOne/src/ /var/www/dropts/ver2/app/src/


const schema = new Schema<Keystore>(
  {
    client: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  ..,
  {
    versionKey: false,
    statics: {
      createKeystore: async function (
       ..
      ) {
        const date = new Date();
        const userDetails = {..
        };
        return await this.create(userDetails);
      },
      getByKey: async function (key) {
        return await this.findOne({ primaryKey: key });
      },
    },
  },
);

schema.index({ client: 1 });
schema.index({ client: 1, primaryKey: 1, status: 1 });
schema.index({ client: 1, primaryKey: 1, secondaryKey: 1 });

routes.forEach(route => {
  router.[route.method](route.path, (req, res, next) => {
    const executeMiddleware = (middlewares: Middleware[], index: number) => {
      if (index >= middlewares.length) {
        if (route.validation) {
          route.validation(req, res, () => {
            executeMiddleware(route.postValidationMiddleware || [], 0);
          });
        } else {
          route.handler(req, res, next);
        }
      } else {
        middlewares[index](req, res, () => executeMiddleware(middlewares, index + 1));
      }
    };

    executeMiddleware(route.preValidationMiddleware || [], 0);
  });
});