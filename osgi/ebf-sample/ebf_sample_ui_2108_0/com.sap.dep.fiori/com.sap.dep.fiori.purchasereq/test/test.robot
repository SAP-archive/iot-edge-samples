*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Purchase Requisition
${AppTitle}                     Purchase Requisitions

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec
${AddMaterialButton}            span[id*=materialAddButton]
${visibleDateDiv}    $('div.sapUiCal.sapUiShd[style*=visible]')


*** Keywords ***
Click Material Add Button
    Click Element                       jquery=${AddMaterialButton}

Select Material
    [Arguments]    ${matnr}
    ${selectMaterial}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('div.sapMLIBSelectM')[0];
    Click Element    ${selectMaterial}

Input Qty
    [Arguments]    ${matnr}    ${qty}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('input.sapMInputBaseInner[type=number]')[0];
    Input Text    ${temp}    ${qty}

Click Date Button
    [Arguments]    ${matnr}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('span[id*=picker]')[0];
    Click Element    ${temp}

Click Ok Button
    ${temp}=    Execute Javascript    return $('button[id*=save-button]')[0];
    Click Element    ${temp}


Add Material
    [Arguments]    ${matnr}    ${qty}    ${year}    ${month}   ${day}
    Wait For    Click Material Add Button
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   ${matnr}    ${qty}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Click Date Button   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick Date    ${year}    ${month}   ${day}  
    Wait For    Click Ok Button



*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Add Material
    Add Material        10020    1    2017    'August'    11

Conclude
    Close Browser


