# start-db.ps1
# 自动启动数据库脚本

$dockerComposeFile = Get-ChildItem -Path . -Filter "docker-compose.yml" -Recurse -Exclude "node_modules" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($dockerComposeFile) {
    Write-Host "Found Docker Compose file at: $($dockerComposeFile.FullName)"
    cd $dockerComposeFile.DirectoryName
    docker-compose up -d
} else {
    Write-Host "No docker-compose.yml found. Searching for PostgreSQL Windows service..."
    $services = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($services) {
        foreach ($service in $services) {
            Write-Host "Starting service: $($service.Name)"
            try {
                Start-Service -Name $service.Name -ErrorAction Stop
                Write-Host "Successfully started $($service.Name)"
            } catch {
                Write-Error "Failed to start service: $($_.Exception.Message). Please run this script as Administrator."
            }
        }
    } else {
        Write-Error "No PostgreSQL service or docker-compose.yml found in the project. Please ensure PostgreSQL is installed."
    }
}
