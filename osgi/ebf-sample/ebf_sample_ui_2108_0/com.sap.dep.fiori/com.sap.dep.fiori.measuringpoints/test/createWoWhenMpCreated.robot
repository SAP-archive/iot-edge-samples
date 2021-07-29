*** Settings ***
Documentation     Navigates to the measuringpoints tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}             Enter Measuring Point
${AppTitle}             Measuring Points

${SaveButton}           button[id*=save-button]
${SecondReadingInput}   dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(1) .sapMInputBaseInner[type="number"]
${BackButton}           backBtn[aria-label="Go Back"]
${TimePickerText}       dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(1) .sapMInputBaseInner[placeholder="HH:mm"]
${DatePickerText}       dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(1) .sapMInputBaseInner[placeholder="MMM d, y"]
${DescriptionText}      input[id*=dep-fiori-workorderop-enter--description-inner]
${MeasuringPointBox}    span:contains('Measuring Points Saved')
${CheckOk}              __mbox-btn-0-content

*** Keywords ***
# keywords local to this file

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering
    Wait Until Page Contains Element    css=#${TimePickerText}

Change Config
    Change Global Sync Option Config    180_CreateWOwhenGreaterThan    1

# do actual tests here

Type Measuing Point Number
    Input Text              css=#${SecondReadingInput}    2
    Wait For Condition      return $('#'+'${SecondReadingInput}').val() === "2";
    Press Key               css=#${SecondReadingInput}    \\13

Type Time
    Input Text              css=#${TimePickerText}    15:23
    Press Key               css=#${TimePickerText}    \\13
    Wait For Condition      return $('#'+'${TimePickerText}').val() === "15:23";

Type Date
    Input Text              css=#${DatePickerText}    April 1, 2017
    Press Key               css=#${DatePickerText}    \\13

Hit Save Button
    Wait Until Element Is Enabled               jquery=${SaveButton}
    Click Element                               jquery=${SaveButton}

Check Toast Message
    Wait Until Page Contains Element            jquery=${MeasuringPointBox}

Hit Back Button
    Click Element                               id=${CheckOk}
    Wait Until Page Contains Element            jquery=#${BackButton}
    Click Element                               jquery=#${BackButton}

Navigate to Work Order Operations App
    Click Element           jquery=li.sapUshellTile div.sapMGT[aria-label*="Work Order Operations"]
    Wait For Condition      return $("."+"sapUshellHeadTitle").text() === "Work Order Operations"

Filter For Work Order
    Click Element           css=#dep-fiori-workorderop-enter--filter-bar-btnFilters
    Wait Until Element Is Visible            jquery=${DescriptionText}
    Input Text              jquery=${DescriptionText}    180 LIGHT SENSOR > 1 LI
    Click Element           jquery=#dep-fiori-workorderop-enter--filter-bar-btnGoFilterDialog
    Wait Until Page Contains Element            jquery=span:contains(180 LIGHT SENSOR > 1 LI)
    Click Element                               jquery=#${BackButton}

Finish Tests
    Wait Until Page Contains Element               css=div.sapUshellShellHeadCenter
    Conclude