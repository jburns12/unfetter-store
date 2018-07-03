from modules import cti
import argparse

def main():
    parser = argparse.ArgumentParser(description='Push repo containing ATT&CK data to STIX')
    parser.add_argument('-o', '--output', action='store', help='output directory')
    parser.add_argument('-t', '--token', action='store', help='GitHub token')
    parser.add_argument('-u', '--user', action='store', help='Github user')
    parser.add_argument('-e', '--email', action='store', help='Github email')

    args = parser.parse_args()

    if args.token and args.user and args.email and args.output:
        if cti.push_repo(args.user, args.email, args.token, args.output) is True:
            print("Successfully published!")
        else:
            print("Unable to publish content.")

if __name__ == "__main__":
    main()