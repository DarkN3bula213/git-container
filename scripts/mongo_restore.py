#!/usr/bin/env python3
import argparse
import logging
import os
import subprocess
import sys
from datetime import datetime

# Configure logging
def setup_logging():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"mongo_restore_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

def run_command(command, error_message):
    """Execute a shell command and handle its output."""
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"{error_message}: {e.stderr}")
        raise RuntimeError(f"{error_message}: {e.stderr}")

def verify_container_running(container_name):
    """Verify if the specified Docker container is running."""
    logger.info(f"Verifying container '{container_name}' status...")
    
    try:
        status = run_command(
            ["docker", "container", "inspect", "-f", "{{.State.Running}}", container_name],
            "Failed to check container status"
        )
        if status.strip() != "true":
            raise RuntimeError(f"Container {container_name} is not running")
        logger.info(f"Container '{container_name}' is running")
    except subprocess.CalledProcessError:
        logger.error(f"Container '{container_name}' not found")
        raise

def copy_dump_to_container(container_name, dump_file):
    """Copy the MongoDB dump file to the container."""
    if not os.path.exists(dump_file):
        logger.error(f"Dump file '{dump_file}' not found")
        raise FileNotFoundError(f"Dump file '{dump_file}' not found")
    
    logger.info(f"Copying dump file '{dump_file}' to container '{container_name}'...")
    run_command(
        ["docker", "cp", dump_file, f"{container_name}:/tmp/"],
        "Failed to copy dump file to container"
    )
    logger.info("Dump file copied successfully")

def restore_mongodb(container_name, dump_file):
    """Restore MongoDB database from the dump file."""
    dump_filename = os.path.basename(dump_file)
    container_dump_path = f"/tmp/{dump_filename}"
    
    logger.info("Starting MongoDB restore operation...")
    restore_command = [
        "docker", "exec", container_name,
        "mongorestore",
        "--db", "docker-db",
        "--drop",  # Drop existing collections before restore
        "--gzip",
        "--archive=" + container_dump_path
    ]
    
    run_command(restore_command, "MongoDB restore failed")
    logger.info("MongoDB restore completed successfully")
    
    # Clean up the dump file from the container
    logger.info("Cleaning up temporary files...")
    run_command(
        ["docker", "exec", container_name, "rm", container_dump_path],
        "Failed to clean up dump file"
    )
    logger.info("Cleanup completed")

def main():
    parser = argparse.ArgumentParser(description="Restore MongoDB dump to a Docker container")
    parser.add_argument("container_name", help="Name of the Docker container")
    parser.add_argument("dump_file", help="Path to the MongoDB dump file (*.gz)")
    args = parser.parse_args()

    try:
        verify_container_running(args.container_name)
        copy_dump_to_container(args.container_name, args.dump_file)
        restore_mongodb(args.container_name, args.dump_file)
        logger.info("MongoDB restore process completed successfully")
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    logger = setup_logging()
    main()

    # python mongo_restore.py git-container-mongo1-1 /Users/ispeakcode/Developer/backup/backup-2025-02-26.gz