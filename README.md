# [AtlasCivs Website (link dead rn)]()
Welcome to the Git repo for the AtlasCivs website! Here is the place to find source code, post issues, and submit pull requests. 
We gladly welcome community contributions, we just ask that you test them first. 

This is a fork of [TEAW-Website](https://github.com/besser435/TEAW-Website). There may be inconsistancies because of this.

## TODO:
- [ ] Improve tmux script
- [ ] Put the project in a venv

## Git guidelines
There are two branches, `prod` and `dev`. The default is `dev`, and where any changes should be made. 

In the future, changes will be deployed by bringing changes over from dev (or some other branch) to prod using a pull request.
Only once approved, will the PR be merged, and the new changes deployed using a GH webhook. 

Before submitting a PR, run the VS Code task to generate the requirements.txt file for pip.



## Starting a development server
To start a local version of the website for testing/development, run the
`atlas_webserver.py` file. This will start Flask in debug mode, with the logger set
to the DEBUG level. This will also enable Flask's debug mode. For any changes to show
up on the website, the process must be restarted.

> [!NOTE]
> In order for the server and API to work, the SQLite DBs will need to contain information. By default, there is some 
data in them. The data will not be updated unless the `db_updater.py` and `stats_updater.py` processes are started, 
but thats not needed for development. 



## Starting a production server
To deploy the server, run the `run_prod.sh` script with Bash. This will take the Flask `app` variable inside the
`atlas_webserver` script, and start it with Gunicorn. Note that this disables any debugging features, and can only be ran on Linux.

The `db_updater.py` and `stats_updater.py` processes need to be started, so the databases are updated. It is best to use 
[tmux](https://github.com/tmux/tmux?tab=readme-ov-file#welcome-to-tmux) to open and keep running the DB updaters and the webserver.
In the future there will be a Bash script to automatically destroy an existing tmux session, and create new ones which contain the 
required processes.

(yes I know tmux is not a proper process management tool, but it works well)


## Contributing
This project happily accepts contributions. You can either open an [issue](https://github.com/besser435/AtlasCivs-Website/issues) for a 
feature request or bug, or submit a pull request if you know how to do that.

> [!IMPORTANT]
> If you encounter a security related bug please let me know in a direct message. I can be found on the [AtlasCivs Discord](https://discord.gg/tZGNUPByjA) as besser.
> If you are a player on AtlasCivs, I am happy to give you diamonds/netherite/resources for finding security related bugs.

