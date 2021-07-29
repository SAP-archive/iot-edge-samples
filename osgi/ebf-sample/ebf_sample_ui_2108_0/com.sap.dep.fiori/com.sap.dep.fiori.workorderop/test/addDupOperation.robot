*** Settings ***
Documentation     Navigates to the workorderOperations tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}             Work Order Operations
${AppTitle}             Work Order Operations

${WORow}                       table[id*=enter-workorder-table] tbody tr:nth-child(4) .sapMListTblCell .sapUiSelectable
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
${CancelButton}                button[id*=cancel-button]
${BackButton}                  backBtn[aria-label="Go Back"]

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
    Input Text       jquery=${InputShortText}    Operation Text

Input Text Planned Hours
    Input Text       jquery=${InputPlannedHours}    3

Input Text Number of Workers
    Input Text       jquery=${InputNumWorkers}    1

Click Cancel Button
    Click Element    jquery=${CancelButton}

Click Fourth Work Order
    Click Element    jquery=${WORow}

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering
    Wait Until Page Contains Element    jquery=${WORow}

# do actual tests here

Select Workorder
    Wait For    Click Fourth Work Order
    Wait Until Page Contains Element    jquery=${WOOperations}
    
#Set "allow duplicates" to Y in case the test has been run once before
    
Set WOAllowDupOperation to Y(1)
    Change Global Sync Option Config      WOAllowDupOperation      Y
    
Add Operation(1)
    Wait For    Click Add Operation
    
Select Workcenter(1)
    Wait For    Click Select Workcenter

Select Control Key(1)
    Wait For    Click Select Control Key
    Wait For    Click Select Control Key First Element

Input Short Text(1)
    Wait For    Input Text Short Text

Input Planned Hours(1)
    Wait For    Input Text Planned Hours
    
Input Number of Workers(1)
    Wait For    Input Text Number of Workers
    
Hit Save Button(1)
    Wait For    Click Save Button
 
Check Operation Toast Message(1)
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Text Should Be                      jquery=div.sapMMessageToast     Operation created
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast

Save Workorder(1)
    Wait For    Click Save Workorder

Check Workorder Toast Message(1)
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Should Contain                      jquery=div.sapMMessageToast     Work order 
    Element Should Contain                      jquery=div.sapMMessageToast     saved
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast

#Add a duplicate operation (not allowed)

Set WOAllowDupOperation to N
    Change Global Sync Option Config      WOAllowDupOperation      N
    
Add Operation(2)
    Wait For    Click Add Operation
    
Select Workcenter(2)
    Wait For    Click Select Workcenter

Select Control Key(2)
    Wait For    Click Select Control Key
    Wait For    Click Select Control Key First Element

Input Short Text(2)
    Wait For    Input Text Short Text

Input Planned Hours(2)
    Wait For    Input Text Planned Hours
    
Input Number of Workers(2)
    Wait For    Input Text Number of Workers
    
Hit Save Button(2)
    Wait For    Click Save Button
 
Check Operation Toast Message(2)
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Text Should Be                      jquery=div.sapMMessageToast     A duplicate operation exists for this workorder
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast

Cancel Operation Adding
    Wait For    Click Cancel Button
    Alert Should Be Present
    
#Allow and add a duplicate

Set WOAllowDupOperation to Y(2)
    Change Global Sync Option Config      WOAllowDupOperation      Y
    
Add Operation(3)
    Wait For    Click Add Operation
    
Select Workcenter(3)
    Wait For    Click Select Workcenter

Select Control Key(3)
    Wait For    Click Select Control Key
    Wait For    Click Select Control Key First Element

Input Short Text(3)
    Wait For    Input Text Short Text

Input Planned Hours(3)
    Wait For    Input Text Planned Hours
    
Input Number of Workers(3)
    Wait For    Input Text Number of Workers
    
Hit Save Button(3)
    Wait For    Click Save Button
 
Check Operation Toast Message(3)
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Text Should Be                      jquery=div.sapMMessageToast     Operation created
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast
    
Save Workorder(2)
    Wait For    Click Save Workorder

Check Workorder Toast Message(2)
    Wait Until Page Contains Element            jquery=div.sapMMessageToast
    Element Should Contain                      jquery=div.sapMMessageToast     Work order 
    Element Should Contain                      jquery=div.sapMMessageToast     saved
    Wait Until Page Does Not Contain Element    jquery=div.sapMMessageToast
    
 
Hit Back Button
    Wait For    Click Back Button

Finish Tests
    Wait Until Page Contains Element            css=div.sapUshellShellHeadCenter
    Conclude