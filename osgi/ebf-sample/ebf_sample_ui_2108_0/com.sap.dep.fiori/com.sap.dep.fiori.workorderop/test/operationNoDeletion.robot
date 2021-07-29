*** Settings ***
Documentation     Navigates to the workorderOperations tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}             Work Order Operations
${AppTitle}             Work Order Operations

${WONum}                       V20700000867 
${WORow}                       table[id*=enter-workorder-table] tbody tr:contains(${WONum})
${WOOperations}                table[id*=woOperationsList] .sapMInputBaseInner
${AddButton}                   button[id*=operationAddButton]
${SelectWorkCentre}            div[id*=opcWorkcenterSelect]
${WorkcenterFirstElement}      li[id*=opcWorkcenterSelect]
${SelectControlKey}            div[id*=opcControlKeySelect]
${ControlKeyFirstElement}      li[id*=opcControlKeySelect]
${InputShortText}              input[id*=txtLTXA1]
${InputPlannedHours}           input[id*=txtDAUNO]
${InputNumWorkers}             input[id*=ARBEI]
${WOAddButton}                 button[id*=add-button]
${SaveButton}                  button[id*=save-button]
${BackButton}                  backBtn[aria-label="Go Back"]
${MaterialDeleteButton}        span[id*=materialDeleteButton]

*** Keywords ***
# keywords local to this file
Click Add Operation
    Click Element    jquery=${AddButton}

Click Select Workorder
    Click Element    jquery=${WORow}

Click Select Workcenter
    Click Element    jquery=${SelectWorkCentre}
    Click Element    jquery=${WorkcenterFirstElement}


Click Select Control Key
    Click Element    jquery=${SelectControlKey}

Click Select Control Key First Element
    Click Element    jquery=${ControlKeyFirstElement}

Click Save Button
    Click Element    jquery=${WOAddButton}

Click Save Workorder
    Click Element    jquery=${SaveButton}

Click Back Button
    Click Element    jquery=#${BackButton}

Input Text Short Text
    Input Text       jquery=${InputShortText}    Blah Blee bloo

Input Text Planned Hours
    Input Text       jquery=${InputPlannedHours}    3

Input Text Number of Workers
    Input Text       jquery=${InputNumWorkers}    1

Click Remove Operation
    Click Element    jquery=${MaterialDeleteButton}

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Select Workorder
    Wait For    Click Select Workorder

Attempt Operation Delete When You Cannot
    Change Global Sync Option Config      WOAllowNoOperation      Y
    Change Global Sync Option Config      WOAllowOperationDelete      N
    Wait For    Click Remove Operation
    Wait For    Click Save Workorder
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Should Contain                      jquery=div.sapMMessageToast     Cannot delete an operation
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast

Attempt Operation Delete When You Can
    Change Global Sync Option Config      WOAllowOperationDelete      Y
    Wait For    Click Remove Operation
    Wait For    Click Save Workorder
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Should Contain                      jquery=div.sapMMessageToast     Work order
    Element Should Contain                      jquery=div.sapMMessageToast     saved
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast 
    
Add Operation
    Wait For    Click Add Operation
    
Select Workcenter
    Wait For    Click Select Workcenter

Select Control Key
    Wait For    Click Select Control Key
    Wait For    Click Select Control Key First Element

Input Short Text
    Wait For    Input Text Short Text

Input Planned Hours
    Wait For    Input Text Planned Hours
    
Input Number of Workers
    Wait For    Input Text Number of Workers
    
Hit Save Button
    Wait For    Click Save Button
 
Check Operation Toast Message
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Text Should Be                      jquery=div.sapMMessageToast     Operation created
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast
    
Save Workorder
    Wait For    Click Save Workorder

Check Workorder Toast Message
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Should Contain                      jquery=div.sapMMessageToast     Work order 
    Element Should Contain                      jquery=div.sapMMessageToast     saved
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast
    
 
Hit Back Button
    Wait For    Click Back Button

Finish Tests
    Wait Until Page Contains Element            css=div.sapUshellShellHeadCenter
    Conclude