CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_ssctgry_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nICid" is null then '' else '"' || replace(replace(cast(new."nICid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cCategory" is null then '' else '"' || replace(replace(cast(new."cCategory" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cICtype" is null then '' else '"' || replace(replace(cast(new."cICtype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nOICid" is null then '' else '"' || cast(cast(new."nOICid" as numeric) as varchar) || '"' end||','||
          case when new."nTempid" is null then '' else '"' || cast(cast(new."nTempid" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnICid" is null then '' else '"' || cast(cast(new."ZnICid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nICid" is null then '' else '"' || replace(replace(cast(old."nICid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cCategory" is null then '' else '"' || replace(replace(cast(old."cCategory" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cICtype" is null then '' else '"' || replace(replace(cast(old."cICtype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nOICid" is null then '' else '"' || cast(cast(old."nOICid" as numeric) as varchar) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnICid" is null then '' else '"' || cast(cast(old."ZnICid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'IssueCategory',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      241,                                                                                                                                             
                                      
          case when old."nICid" is null then '' else '"' || replace(replace(cast(old."nICid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_issuecategory',                                                                                                                                                
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
