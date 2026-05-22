CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_tmmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'TeamMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      252,                                                                                                                                             
                                      
          case when old."nTeamid" is null then '' else '"' || replace(replace(cast(old."nTeamid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nTeamid" is null then '' else '"' || replace(replace(cast(old."nTeamid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTeamname" is null then '' else '"' || replace(replace(cast(old."cTeamname" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFlag" is null then '' else '"' || replace(replace(cast(old."cFlag" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cClr" is null then '' else '"' || replace(replace(cast(old."cClr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nOTeamid" is null then '' else '"' || cast(cast(old."nOTeamid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCreateId" is null then '' else '"' || replace(replace(cast(old."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUpdateId" is null then '' else '"' || replace(replace(cast(old."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateId" is null then '' else '"' || cast(cast(old."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnTeamid" is null then '' else '"' || cast(cast(old."ZnTeamid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUpdateId" is null then '' else '"' || cast(cast(old."ZnUpdateId" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_teammaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
