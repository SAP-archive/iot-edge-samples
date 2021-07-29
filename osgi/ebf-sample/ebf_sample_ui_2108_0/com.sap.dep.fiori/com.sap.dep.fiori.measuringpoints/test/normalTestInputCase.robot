*** Settings ***
Documentation     Navigates to the measuringpoints tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}             Enter Measuring Point
${AppTitle}             Measuring Points

${SaveButton}           button[id*=save-button]
${SecondReadingInput}   dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[type="number"]
${BackButton}           backBtn[aria-label="Go Back"]
${TimePickerText}       dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[placeholder="HH:mm"]
${DatePickerText}       dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[placeholder="MMM d, y"]
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

# do actual tests here

Type Measuing Point Number
    Input Text              css=#${SecondReadingInput}    6686
    Wait For Condition      return $('#'+'${SecondReadingInput}').val() === "6686";
    Press Key               css=#${SecondReadingInput}    \\13

Type Time
    Input Text              css=#${TimePickerText}    11:58
    Press Key               css=#${TimePickerText}    \\13
    Wait For Condition      return $('#'+'${TimePickerText}').val() === "11:58";

Type Date
    Input Text              css=#${DatePickerText}    May 19, 2015
    Press Key               css=#${DatePickerText}    \\13
    Wait For Condition      return $('#'+'${DatePickerText}').val() === "May 19, 2015";

Hit Save Button
    Wait Until Element Is Enabled               jquery=${SaveButton}
    Click Element                               jquery=${SaveButton}

Check Toast Message
    Wait Until Page Contains Element            jquery=${MeasuringPointBox}

Hit Back Button
    Click Element                               id=${CheckOk}
    Wait Until Page Contains Element            jquery=#${BackButton}
    Click Element                               jquery=#${BackButton}

Finish Tests
    Wait Until Page Contains Element               css=div.sapUshellShellHeadCenter
    Conclude