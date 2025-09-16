$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwM2EyZDUzZS0wYzZkLTQ1YTktOWNmYS0wZTNkNzQ0ZmY2MGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYwMDg5MTcsImV4cCI6MTc1NjYxMzcxN30.placeholder"
}

try {
    Write-Host "Getting master classes..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri "https://waxhands.ru/api/master-classes" -Headers $headers
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Found master classes: $($data.data.masterClasses.Count)" -ForegroundColor Green
    
    $masterClassesWithParticipants = @()
    
    foreach ($masterClass in $data.data.masterClasses) {
        if ($masterClass.participants -and $masterClass.participants.Count -gt 0) {
            $masterClassesWithParticipants += $masterClass
        }
    }
    
    Write-Host "Master classes with participants: $($masterClassesWithParticipants.Count)" -ForegroundColor Cyan
    
    if ($masterClassesWithParticipants.Count -gt 0) {
        $firstMasterClass = $masterClassesWithParticipants[0]
        Write-Host "`nFirst master class with participants:" -ForegroundColor Yellow
        Write-Host "ID: $($firstMasterClass.id)"
        Write-Host "Name: $($firstMasterClass.name)"
        Write-Host "Date: $($firstMasterClass.date)"
        Write-Host "Time: $($firstMasterClass.time)"
        Write-Host "Participants: $($firstMasterClass.participants.Count)"
        
        Write-Host "`nParticipants:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $firstMasterClass.participants.Count; $i++) {
            $participant = $firstMasterClass.participants[$i]
            Write-Host "  Participant $($i + 1):"
            Write-Host "    ID: $($participant.id)"
            Write-Host "    childId: $($participant.childId)"
            Write-Host "    childName: $($participant.childName)"
            Write-Host "    parentId: $($participant.parentId)"
            Write-Host "    totalAmount: $($participant.totalAmount)"
            Write-Host "    isPaid: $($participant.isPaid)"
            Write-Host ""
        }
        
        # Test removing first participant
        $firstParticipant = $firstMasterClass.participants[0]
        Write-Host "Testing removal of participant: $($firstParticipant.childName) (ID: $($firstParticipant.id))" -ForegroundColor Red
        
        $removeBody = @{
            workshopId    = $firstMasterClass.id
            participantId = $firstParticipant.id
        } | ConvertTo-Json
        
        try {
            $removeResponse = Invoke-WebRequest -Uri "https://waxhands.ru/api/workshop-registrations/remove-participant" -Method POST -Headers $headers -Body $removeBody -ContentType "application/json"
            
            Write-Host "Participant successfully removed! Status: $($removeResponse.StatusCode)" -ForegroundColor Green
            
            $removeResult = $removeResponse.Content | ConvertFrom-Json
            Write-Host "Result: $($removeResult.message)" -ForegroundColor Green
            
        }
        catch {
            Write-Host "Error removing participant:" -ForegroundColor Red
            Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
            
            if ($_.Exception.Response) {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorContent = $reader.ReadToEnd()
                Write-Host "Error details: $errorContent" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "No master classes with participants found" -ForegroundColor Red
    }
    
}
catch {
    Write-Host "Error getting data: $($_.Exception.Message)" -ForegroundColor Red
}