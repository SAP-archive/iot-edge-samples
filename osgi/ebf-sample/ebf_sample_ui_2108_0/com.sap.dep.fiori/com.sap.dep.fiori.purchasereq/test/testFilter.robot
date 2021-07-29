*** Settings ***
Documentation     Navigates to the work order tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Purchase Requisition
${AppTitle}                     Purchase Requisitions
${AddMaterialButton}            span[id*=materialAddButton]
${FilterButton}                 span[id*=filter-bar-btnFilters-content]
${FilterInputMaterial}          input[id*=materialFilterInput]
${FilterInputDescription}       input[id*=descFilterInput]
${GoButton}                     span[id*=btnGoFilterDialog]


*** Keywords ***
Click Material Add Button
     Click Element         jquery=${AddMaterialButton}

Type In Material Info For Filtering
     Input Text            jquery=${FilterInputMaterial}              10020

Type In Description Info For Filtering
     Input Text            jquery=${FilterInputDescription}           CARTRIDGE

*** Test Cases ***
Start Test
     Open Browser To Start
     Log In

Navigate to App
     Click Launchpad Tile And Entering

Click Add Material Button
     Wait For    Click Material Add Button

Click Filter Button
     Click Element         jquery=${FilterButton}

Input Material And Description Info For Filtering
     Wait For         Type In Material Info For Filtering
     Wait For         Type In Description Info For Filtering

Click Go Button And Check Filtering results
     Click Element         jquery=${GoButton}
     Wait Until Page Contains Element       jquery=label:contains(10020)

Conclude
    Close Browser