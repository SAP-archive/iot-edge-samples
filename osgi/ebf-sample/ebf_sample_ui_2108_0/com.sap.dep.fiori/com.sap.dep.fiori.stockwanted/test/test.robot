*** Settings ***
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Required Materials
${AppTitle}                     Required Materials

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec
${CreatePRButton}     button[id*=dep-fiori-stockwanted-enter--save-button]

*** Keywords ***

Select Material
    [Arguments]    ${matnr}
    ${selectMaterial}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('div.sapMLIBSelectM')[0];
    Click Element    ${selectMaterial}

Check Min Max And Stock_In_Hand
    [Arguments]    ${matnr}
    ${stockOnHand}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('label.stockOnHand')[0];
    ${min}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('span.Min')[0];
    ${max}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('span.Max')[0];
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Wait Until Page Contains Element    ${stockOnHand}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Wait Until Page Contains Element    ${Min}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Wait Until Page Contains Element    ${Max}

Type In Qty Req
    ${Qtyreq}=    Execute Javascript    return $('label:contains(10013)').parent().parent().parent().parent().find('div.materialReqQuantity input')[0];
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}     Input Text     ${Qtyreq}     3

Click Save Button
    Click Element    jquery=${CreatePRButton}


*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Check Infomations
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   10013
    Check Min Max And Stock_In_Hand     10013

Make A Purchase Requisition
    Type In Qty Req
    Wait For    Click Save Button

Check Toast
    Wait Until Page Contains Element       jquery=div:contains(PR)

Conclude
    Close Browser


