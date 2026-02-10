pipeline {
    agent any
    environment {
        CHANGED_SERVICES = ''
        INSTALL_DEPENDENCIES = false
        GLOBAL_DOCKER_APP = "${env.GLOBAL_DOCKER_APP}" // "/var/lib/jenkins/workspace/DockerApps"
        FRONTEND_URL = "${env.FRONTEND_URL}" // "/mnt/external/docker/etabella-frontend"
        BACKEND_URL = "${env.BACKEND_URL}" // "/mnt/external/docker/etabella-backend"
        S3_BUCKET_NAME = "${env.S3_BUCKET_NAME}" //"etabella"
        S3_OBJECT_KEY = "${env.S3_OBJECT_KEY}" //"project/window-structureV2.zip" // Replace with your desired S3 object key
        REMOTE_SERVER_TECH_FRONTEND = "${env.REMOTE_SERVER_TECH_FRONTEND}" //'103.253.145.78'
        REMOTE_USER_TECH_FRONTEND = "${env.REMOTE_USER_TECH_FRONTEND}" //'root'
        REMOTE_DEPLOY_DIR_TECH_FRONTEND = "${env.REMOTE_DEPLOY_DIR_TECH_FRONTEND}" //'/var/www/html/api2'
        REMOTE_SERVER_TECH_BACKEND = "${env.REMOTE_SERVER_TECH_BACKEND}" //'68.183.90.247'
        REMOTE_USER_TECH_BACKEND = "${env.REMOTE_USER_TECH_BACKEND}" //'root'
        REMOTE_DEPLOY_DIR_TECH_BACKEND = "${env.REMOTE_DEPLOY_DIR_TECH_BACKEND}" //'/mnt/volume_blr1_03/api2'
        REMOTE_SERVER_COM_FRONTEND = "${env.REMOTE_SERVER_COM_FRONTEND}" //'45.76.154.127'
        REMOTE_USER_COM_FRONTEND = "${env.REMOTE_USER_COM_FRONTEND}" //'root'
        REMOTE_DEPLOY_DIR_COM_FRONTEND = "${env.REMOTE_DEPLOY_DIR_COM_FRONTEND}" //'/var/www/html/api2'
        REMOTE_SERVER_COM_BACKEND = "${env.REMOTE_SERVER_COM_BACKEND}" //'139.180.153.126'
        REMOTE_USER_COM_BACKEND = "${env.REMOTE_USER_COM_BACKEND}" //'root'
        REMOTE_DEPLOY_DIR_COM_BACKEND = "${env.REMOTE_DEPLOY_DIR_COM_BACKEND}" //'/media/root/b97ab705-2d14-4b76-82f0-05828275f4ba/api2'
    }
    stages {
        stage('Check Changed Services') {
            steps {
                script {
                    // Check if there is a previous commit
                    def isInitialBuild = sh(script: "git rev-parse HEAD~1", returnStatus: true) != 0
                    
                    def changedFiles = []
                    if (!isInitialBuild) {
                        // Identify changed files between the last two commits
                        changedFiles = sh(script: "git diff --name-only HEAD~1 HEAD", returnStdout: true).trim().split('\n')
                    } else {
                        // On initial build, consider all files as changed
                        changedFiles = sh(script: "git ls-tree --name-only -r HEAD", returnStdout: true).trim().split('\n')
                    }

                    // Debugging output for changed files
                    echo "DEBUG: Changed files are:"
                    changedFiles.each { file ->
                        echo " - ${file}"
                    }

                    // Check if package.json or package-lock.json changed
                    INSTALL_DEPENDENCIES = changedFiles.any { file -> 
                        file == 'package.json' || file == 'package-lock.json'
                    }
                    echo "DEBUG: Install dependencies? ${INSTALL_DEPENDENCIES}"

                    // Map services to changes (all services are under /apps)
                    def services = ['authapi', 'coreapi', 'upload', 'socket-app', 'pagination', 'download', 'export', 'hyperlink', 'batchfile', 'indexapi','presentation']
                    def affectedServices = services.findAll { service ->
                        changedFiles.any { file ->
                            def matched = file.startsWith("apps/${service}/")
                            if (matched) {
                                echo "DEBUG: File ${file} matches service ${service}"
                            }
                            return matched
                        }
                    }

                    // Debugging output for affected services
                    if (affectedServices.isEmpty()) {
                        echo "DEBUG: No services were affected."
                    } else {
                        echo "DEBUG: Affected services are: ${affectedServices.join(', ')}"
                    }

                    CHANGED_SERVICES = affectedServices.join(',')
                    if (CHANGED_SERVICES.isEmpty()) {
                        // Gracefully exit if no services were affected
                        echo 'No microservices affected. Skipping build process.'
                        return
                    }
                }
            }
        }
        stage('Install Dependencies') {
            when {
                expression { return INSTALL_DEPENDENCIES }
            }
            steps {
                sh """
                # Install all dependencies at the root level
                npm install --force
                """
            }
        }
        stage('Update NodeModules Image') {
            when {
                expression { return INSTALL_DEPENDENCIES }
            }
            steps {
                withCredentials([string(credentialsId: 'SERVER_SUDO_PASSWORD', variable: 'SUDO_PASSWORD')]) {
                    script {
                        def packageJsonSource = "package.json"
                        def targetPaths = [
                            "${FRONTEND_URL}/micro services/package.json",
                            "${FRONTEND_URL}/micro services/nodemodulesimage/package.json",
                            "${BACKEND_URL}/micro services/package.json"
                        ]

                        targetPaths.each { targetPath ->
                            sh """
                                echo "Copying ${packageJsonSource} to ${targetPath}"
                                echo "$SUDO_PASSWORD" | sudo -S cp ${packageJsonSource} "${targetPath}"
                            """
                        }

                        // Rebuild the `nodemodulesimage`
                        sh """
                            echo "Rebuilding the nodemodulesimage"
                            cd "${FRONTEND_URL}/micro services/nodemodulesimage"
                            docker build -t monorepo-base:latest -f Dockerfile.base .
                        """
                    }
                }
            }
        }
        stage('Move Other Dependent Files') {
            steps {
                withCredentials([string(credentialsId: 'SERVER_SUDO_PASSWORD', variable: 'SUDO_PASSWORD')]) {
                    script {
                        // List of files to track for changes and their destinations
                        def filesToMove = [
                            ["source": "assets/realtime-transcripts/demo-stream.json", "destination": "${FRONTEND_URL}/assets/realtime-transcripts/demo-stream.json"],
                            ["source": "assets/fonts/*", "destination": "${BACKEND_URL}/assets/fonts/"],
                            ["source": "assets/icon/*", "destination": "${BACKEND_URL}/assets/icon/"],
                            ["source": "assets/realtime-transcripts/exports/htmlTemplate.html", "destination": "${FRONTEND_URL}/assets/realtime-transcripts/exports/htmlTemplate.html"],
                            ["source": "assets/pythons/*", "destination": "${BACKEND_URL}/assets/pythons/"],
                            ["source": "assets/pythons/annot-transfer/*", "destination": "${FRONTEND_URL}/assets/pythons/annot-transfer/"]
                        ]

                        // Fetch changed files in the latest commit
                        def changedFiles = sh(script: "git diff --name-only HEAD~1 HEAD", returnStdout: true).trim().split('\n')

                        // Iterate over the files to move
                        filesToMove.each { file ->
                            def source = file.source
                            def destination = file.destination

                            // Check if the source file has changed
                            def shouldMove = changedFiles.any { changedFile ->
                                return changedFile == source || changedFile.startsWith(source.replace('/*', '/'))
                            }

                            // Move the file only if it has changed
                            if (shouldMove) {
                                echo "Detected changes in ${source}. Moving to ${destination}."

                                sh """
                                    # Create destination directory if it does not exist
                                    echo "\$SUDO_PASSWORD" | sudo -S mkdir -p "\$(dirname '${destination}')"

                                    # Copy files to the destination
                                    echo "\$SUDO_PASSWORD" | sudo -S cp -r ${source} "${destination}"
                                """
                            } else {
                                echo "No changes detected for ${source}. Skipping."
                            }
                        }
                    }
                }
            }
        }
        stage('Build Affected Services') {
            when {
                expression { return CHANGED_SERVICES != '' }
            }
            steps {
                script {
                    CHANGED_SERVICES.split(',').each { service ->
                        echo "Building microservice: ${service}"
                        sh """
                        # Build the microservice
                        nest build ${service}
                        """
                    }
                }
            }
        }


        stage('Build and Deploy Services') {
            when {
                expression { return CHANGED_SERVICES != '' }
            }
            steps {
                withCredentials([string(credentialsId: 'SERVER_SUDO_PASSWORD', variable: 'SUDO_PASSWORD')]) {
                    script {
                        CHANGED_SERVICES.split(',').each { service ->
                            echo "Processing microservice: ${service}"

                            def frontendServices = ['authapi', 'coreapi', 'socket-app', 'presentation']
                            def backendServices = ['upload', 'pagination', 'download', 'export', 'hyperlink', 'batchfile', 'indexapi']
                            def destinationPath = ''
                            def dockerComposeFile = ''

                            if (frontendServices.contains(service)) {
                                destinationPath = "${FRONTEND_URL}/micro services/${service}/dist/"
                                dockerComposeFile = "${FRONTEND_URL}/micro services/docker-compose.yml"
                            } else if (backendServices.contains(service)) {
                                destinationPath = "${BACKEND_URL}/micro services/${service}/dist/"
                                dockerComposeFile = "${BACKEND_URL}/micro services/docker-compose.yml"
                            } else {
                                echo "DEBUG: No paths defined for service: ${service}"
                                return
                            }

                            // Move build files
                            sh """
                                echo "Creating destination directory: ${destinationPath}"
                                echo "$SUDO_PASSWORD" | sudo -S mkdir -p "${destinationPath}"

                                echo "Copying main.js to ${destinationPath}"
                                echo "$SUDO_PASSWORD" | sudo -S cp dist/apps/${service}/main.js "${destinationPath}"

                                echo "Setting permissions for ${destinationPath}"
                                echo "$SUDO_PASSWORD" | sudo -S chown -R www-data:www-data "${destinationPath}"
                                echo "$SUDO_PASSWORD" | sudo -S chmod -R 755 "${destinationPath}"
                            """

                            // Rebuild and restart Docker containers
                            sh """
                                echo "Stopping container for service: ${service}"
                                docker-compose -f "${dockerComposeFile}" rm -sf ${service} || true

                                echo "Rebuilding container for service: ${service}"
                                docker-compose -f "${dockerComposeFile}" build ${service}

                                echo "Restarting container for service: ${service}"
                                docker-compose -f "${dockerComposeFile}" up -d ${service}
                            """

                        }
                    }
                }
            }
        }


        stage('Approval for Production Deploy') {
            when {
                expression { return CHANGED_SERVICES != '' }
            }
            steps {
                script {
                    // Pause and wait for user input
                    def userInput = input(
                        id: 'Proceed1', 
                        message: 'Test deployment is complete. Would you like to proceed with Production deployment?', 
                        parameters: [
                            choice(choices: ['Yes', 'No'], description: 'Proceed with deployment?', name: 'PROCEED'),
                            string(defaultValue: '', description: 'Enter deployment notes', name: 'DEPLOY_NOTES'),
                            booleanParam(defaultValue: false, description: 'Notify team after deployment?', name: 'NOTIFY_TEAM')
                        ]
                    )
                    
                    if (userInput == 'No') {
                        error('Production deployment aborted by user')
                    }
                }
            }
        }

        
        stage('Copy Services to Another Server') {
            when {
                expression { return CHANGED_SERVICES != '' }
            }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'SERVER2_SSH_KEY', keyFileVariable: 'SSH_KEY')]) {
                    script {
                        def frontendServices = ['authapi', 'coreapi', 'socket-app', 'presentation']
                        def backendServices = ['upload', 'pagination', 'download', 'export', 'hyperlink', 'batchfile', 'indexapi']
                        
                        CHANGED_SERVICES.split(',').each { service ->
                            if (frontendServices.contains(service)) {
                                // TECH Frontend
                                def remoteDirTech = "${REMOTE_DEPLOY_DIR_TECH_FRONTEND}/apps/${service}"
                                sh """
                                    echo "Creating directory on TECH frontend server for ${service}"
                                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${REMOTE_USER_TECH_FRONTEND}@${REMOTE_SERVER_TECH_FRONTEND}" \
                                        "mkdir -p ${remoteDirTech}"

                                    echo "Copying main.js to TECH frontend server for ${service}"
                                    scp -i "$SSH_KEY" dist/apps/${service}/main.js "${REMOTE_USER_TECH_FRONTEND}@${REMOTE_SERVER_TECH_FRONTEND}:${remoteDirTech}/"
                                """

                                // COM Frontend
                                def remoteDirCom = "${REMOTE_DEPLOY_DIR_COM_FRONTEND}/apps/${service}"
                                sh """
                                    echo "Creating directory on COM frontend server for ${service}"
                                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${REMOTE_USER_COM_FRONTEND}@${REMOTE_SERVER_COM_FRONTEND}" \
                                        "mkdir -p ${remoteDirCom}"

                                    echo "Copying main.js to COM frontend server for ${service}"
                                    scp -i "$SSH_KEY" dist/apps/${service}/main.js "${REMOTE_USER_COM_FRONTEND}@${REMOTE_SERVER_COM_FRONTEND}:${remoteDirCom}/"
                                """
                            } else if (backendServices.contains(service)) {
                                // TECH Backend
                                def remoteDirTech = "${REMOTE_DEPLOY_DIR_TECH_BACKEND}/apps/${service}"
                                sh """
                                    echo "Creating directory on TECH backend server for ${service}"
                                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${REMOTE_USER_TECH_BACKEND}@${REMOTE_SERVER_TECH_BACKEND}" \
                                        "mkdir -p ${remoteDirTech}"

                                    echo "Copying main.js to TECH backend server for ${service}"
                                    scp -i "$SSH_KEY" dist/apps/${service}/main.js "${REMOTE_USER_TECH_BACKEND}@${REMOTE_SERVER_TECH_BACKEND}:${remoteDirTech}/"
                                """

                                // COM Backend
                                def remoteDirCom = "${REMOTE_DEPLOY_DIR_COM_BACKEND}/apps/${service}"
                                sh """
                                    echo "Creating directory on COM backend server for ${service}"
                                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${REMOTE_USER_COM_BACKEND}@${REMOTE_SERVER_COM_BACKEND}" \
                                        "mkdir -p ${remoteDirCom}"

                                    echo "Copying main.js to COM backend server for ${service}"
                                    scp -i "$SSH_KEY" dist/apps/${service}/main.js "${REMOTE_USER_COM_BACKEND}@${REMOTE_SERVER_COM_BACKEND}:${remoteDirCom}/"
                                """
                            } else {
                                echo "Service ${service} does not belong to frontend or backend. Skipping."
                            }
                        }
                    }
                }
            }
        }


        stage('Prepaire Local Build Zip') {
            steps {
                withCredentials([string(credentialsId: 'SERVER_SUDO_PASSWORD', variable: 'SUDO_PASSWORD')]) {
                    script {
                        // Ensure CHANGED_SERVICES is not empty
                        if (CHANGED_SERVICES) {
                            def changedServices = CHANGED_SERVICES.split(',')

                            // Prepare directories and copy only CHANGED_SERVICES
                            changedServices.each { service ->
                                def serviceSource = "dist/apps/${service}/main.js"
                                def serviceDestination = "${GLOBAL_DOCKER_APP}/micro services/${service}/dist/main.js"

                                sh """
                                    echo "Preparing directory for ${service}"
                                    echo "\$SUDO_PASSWORD" | sudo -S mkdir -p "\$(dirname '${serviceDestination}')"

                                    echo "Copying ${serviceSource} to ${serviceDestination}"
                                    echo "\$SUDO_PASSWORD" | sudo -S cp ${serviceSource} "${serviceDestination}"
                                """
                            }
                        } else {
                            echo "No changed services detected. Skipping zip preparation."
                        }
                            def assetsToCopy = [
                                ["source": "assets/fonts/*", "destination": "${GLOBAL_DOCKER_APP}/assets/fonts/"],
                                ["source": "assets/icon/*", "destination": "${GLOBAL_DOCKER_APP}/assets/icon/"],
                                ["source": "assets/pythons/*", "destination": "${GLOBAL_DOCKER_APP}/assets/pythons/"],
                                ["source": "assets/realtime-transcripts/demo-stream.json", "destination": "${GLOBAL_DOCKER_APP}/assets/realtime-transcripts/demo-stream.json"],
                                ["source": "assets/realtime-transcripts/exports/htmlTemplate.html", "destination": "${GLOBAL_DOCKER_APP}/assets/realtime-transcripts/exports/htmlTemplate.html"],
                                // ["source": "${FRONTEND_URL}/html/*", "destination": "${GLOBAL_DOCKER_APP}/html/"]
                            ]

                            // Copy package.json to required locations
                            def packageJsonTargets = [
                                "${GLOBAL_DOCKER_APP}/micro services/package.json",
                                "${GLOBAL_DOCKER_APP}/micro services/nodemodulesimage/package.json"
                            ]

                            packageJsonTargets.each { targetPath ->
                                sh """
                                    echo "Copying package.json to ${targetPath}"
                                    echo "\$SUDO_PASSWORD" | sudo -S mkdir -p "\$(dirname '${targetPath}')"
                                    echo "\$SUDO_PASSWORD" | sudo -S cp package.json "${targetPath}"
                                """
                            }

                            // Remove everything in `${GLOBAL_DOCKER_APP}/html/` before copying
                            // sh """
                            //     echo "Clearing ${GLOBAL_DOCKER_APP}/html/"
                            //     echo "\$SUDO_PASSWORD" | sudo -S rm -rf "${GLOBAL_DOCKER_APP}/html/"
                            // """

                            // Copy other assets
                            assetsToCopy.each { asset ->
                                sh """
                                    echo "Preparing directory for ${asset.destination}"
                                    echo "\$SUDO_PASSWORD" | sudo -S mkdir -p "${asset.destination}"

                                    echo "Copying ${asset.source} to ${asset.destination} (if exists)"
                                    if ls ${asset.source} >/dev/null 2>&1; then
                                        echo "\$SUDO_PASSWORD" | sudo -S cp -r ${asset.source} "${asset.destination}"
                                    else
                                        echo "No matching files found for ${asset.source}. Skipping."
                                    fi
                                """
                            }

                            // Change ownership of the GLOBAL_DOCKER_APP directory
                            sh """
                                echo "Setting permissions for ${GLOBAL_DOCKER_APP}"
                                echo "\$SUDO_PASSWORD" | sudo -S chown -R jenkins:jenkins "${GLOBAL_DOCKER_APP}"
                            """

                            
                            // Delete existing zip file if it exists
                            sh """
                                echo "Checking for existing zip file"
                                if [ -f "${GLOBAL_DOCKER_APP}/window-structureV2.zip" ]; then
                                    echo "Deleting existing zip file"
                                    rm -f "${GLOBAL_DOCKER_APP}/window-structureV2.zip"
                                fi
                            """

                            // Create zip file in GLOBAL_DOCKER_APP without sudo
                            sh """
                                echo "Creating zip file in ${GLOBAL_DOCKER_APP}"
                                cd ${GLOBAL_DOCKER_APP}
                                zip -r window-structureV2.zip . -x ".*~" -x "*.bak"
                                echo "window-structureV2.zip created at ${GLOBAL_DOCKER_APP}"
                            """
                            // Upload the zip file to S3
                            sh """
                                echo "Uploading window-structureV2.zip to S3 bucket ${S3_BUCKET_NAME} using s3cmd"
                                s3cmd put "${GLOBAL_DOCKER_APP}/window-structureV2.zip" "s3://${S3_BUCKET_NAME}/${S3_OBJECT_KEY}"
                                echo "Upload complete: s3://${S3_BUCKET_NAME}/${S3_OBJECT_KEY}"
                            """
                       
                    }
                }
            }
        }







    }
    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}
