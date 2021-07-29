*** Settings ***
Documentation     Navigates to the measuringpoints tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}     Enter Measuring Point
${AppTitle}     Measuring Points

${ErrorMessage}         New reading cannot be greater than the time since the last reading
${SaveButton}           id=dep-fiori-measuringpoints-enter--save-button
${MessageBoxButton}     id=dep-fiori-measuringpoints-enter--messages-button
${SecondReadingInput}    dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[type="number"]
${TimePickerText}       dep-fiori-measuringpoints-enter--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[placeholder="HH:mm"]
${ErrorBoxButton}       ul.sapMSegmentedButtonNoAutoWidth[role="radiogroup"] .sapMMsgPopoverBtnError[aria-posinset="2"]
${AllButton}            ul.sapMSegmentedButtonNoAutoWidth[role="radiogroup"] .sapMMsgPopoverBtnAll[aria-posinset="1"]
${ErrorText}            div.sapMSLIDescriptionDiv .sapMSLIDescription
${BackButton}           backBtn[aria-label="Go Back"]

*** Keywords ***
# keywords local to this file

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering
    Wait Until Page Contains Element    css=#${TimePickerText}

Type Measuing Point Number
    Input Text              css=#${SecondReadingInput}    588888888888
    Wait For Condition      return $('#'+'${SecondReadingInput}').val() === "588888888888";
    Press Key               css=#${SecondReadingInput}    \\13

Click The Message Box
    Click Element           ${MessageBoxButton}
    Click Element           jquery=${ErrorBoxButton}
    Click Element           ${MessageBoxButton}
    Click Element           jquery=${AllButton}

Check Error Message
    Wait Until Page Contains Element    jquery=${ErrorText}
    Element Text Should Be              jquery=${ErrorText}     ${ErrorMessage}

Hit Back Button
    Execute Javascript                  sap.ushell.Container.setDirtyFlag(false);
    Wait Until Page Contains Element    jquery=#${BackButton}
    Click Element                       jquery=#${BackButton}

Finish Tests
    Wait Until Page Contains Element       css=div.sapUshellShellHeadCenter
    Conclude