CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_cntctmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nContactid" is null then '' else '"' || replace(replace(cast(new."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cProfile" is null then '' else '"' || replace(replace(cast(new."cProfile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cFname" is null then '' else '"' || replace(replace(cast(new."cFname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLname" is null then '' else '"' || replace(replace(cast(new."cLname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cAlias" is null then '' else '"' || replace(replace(cast(new."cAlias" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLinkedin" is null then '' else '"' || replace(replace(cast(new."cLinkedin" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cEmail" is null then '' else '"' || replace(replace(cast(new."cEmail" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cCountrycode" is null then '' else '"' || replace(replace(cast(new."cCountrycode" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cMobile" is null then '' else '"' || replace(replace(cast(new."cMobile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cNote" is null then '' else '"' || replace(replace(cast(new."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nTZid" is null then '' else '"' || cast(cast(new."nTZid" as numeric) as varchar) || '"' end||','||
          case when new."cIso" is null then '' else '"' || replace(replace(cast(new."cIso" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cCompany" is null then '' else '"' || replace(replace(cast(new."cCompany" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nOContactid" is null then '' else '"' || cast(cast(new."nOContactid" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCompanyid" is null then '' else '"' || replace(replace(cast(new."nCompanyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRoleid" is null then '' else '"' || replace(replace(cast(new."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCompanyid" is null then '' else '"' || cast(cast(new."ZnCompanyid" as numeric) as varchar) || '"' end||','||
          case when new."ZnContactid" is null then '' else '"' || cast(cast(new."ZnContactid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRoleid" is null then '' else '"' || cast(cast(new."ZnRoleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cMentiontag" is null then '' else '"' || replace(replace(cast(new."cMentiontag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cOccupation" is null then '' else '"' || replace(replace(cast(new."cOccupation" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPartyid" is null then '' else '"' || cast(cast(new."nPartyid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nContactid" is null then '' else '"' || replace(replace(cast(old."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cProfile" is null then '' else '"' || replace(replace(cast(old."cProfile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFname" is null then '' else '"' || replace(replace(cast(old."cFname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLname" is null then '' else '"' || replace(replace(cast(old."cLname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cAlias" is null then '' else '"' || replace(replace(cast(old."cAlias" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLinkedin" is null then '' else '"' || replace(replace(cast(old."cLinkedin" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cEmail" is null then '' else '"' || replace(replace(cast(old."cEmail" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cCountrycode" is null then '' else '"' || replace(replace(cast(old."cCountrycode" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cMobile" is null then '' else '"' || replace(replace(cast(old."cMobile" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cNote" is null then '' else '"' || replace(replace(cast(old."cNote" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nTZid" is null then '' else '"' || cast(cast(old."nTZid" as numeric) as varchar) || '"' end||','||
          case when old."cIso" is null then '' else '"' || replace(replace(cast(old."cIso" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cCompany" is null then '' else '"' || replace(replace(cast(old."cCompany" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nOContactid" is null then '' else '"' || cast(cast(old."nOContactid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCompanyid" is null then '' else '"' || replace(replace(cast(old."nCompanyid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRoleid" is null then '' else '"' || replace(replace(cast(old."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCompanyid" is null then '' else '"' || cast(cast(old."ZnCompanyid" as numeric) as varchar) || '"' end||','||
          case when old."ZnContactid" is null then '' else '"' || cast(cast(old."ZnContactid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRoleid" is null then '' else '"' || cast(cast(old."ZnRoleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cMentiontag" is null then '' else '"' || replace(replace(cast(old."cMentiontag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cOccupation" is null then '' else '"' || replace(replace(cast(old."cOccupation" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPartyid" is null then '' else '"' || cast(cast(old."nPartyid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'ContactMaster',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      268,                                                                                                                                             
                                      
          case when old."nContactid" is null then '' else '"' || replace(replace(cast(old."nContactid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_contactmaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
