from git import Repo
import subprocess
import os

def clone_repo(output_dir):
    try:
        Repo.clone_from("https://github.com/jburns12/cti_test.git", output_dir)
        success = True
    except Exception as e:
        success = False
        print(e.message, e.args)
    
    return success

def push_repo(user, email, token, output_dir):
    try:
        os.chdir(output_dir)
        add_msg = 'git add .'
        config_email = 'git config --global user.email "' + email + '"'
        config_name = 'git config --global user.name "' + user + '"'
        push_cmd = 'git push https://' + user + ':' + token + '@github.com/jburns12/cti_test.git'
        subprocess.check_output(add_msg, shell=True)
        subprocess.check_output(config_email, shell=True)
        subprocess.check_output(config_name, shell=True)
        subprocess.check_output('git commit -m "test"', shell=True)
        subprocess.Popen(push_cmd, shell=True)
        success = True
    except:
        success = False

    return success