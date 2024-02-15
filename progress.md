
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