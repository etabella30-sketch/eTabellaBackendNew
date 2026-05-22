CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rlprmssn_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nRPid" is null then '' else '"' || replace(replace(cast(new."nRPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPMid" is null then '' else '"' || cast(cast(new."nPMid" as numeric) as varchar) || '"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dModifydt" is null then '' when isfinite(new."dModifydt") then '"' || to_char(new."dModifydt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nORPid" is null then '' else '"' || cast(cast(new."nORPid" as numeric) as varchar) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRoleid" is null then '' else '"' || replace(replace(cast(new."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRPid" is null then '' else '"' || cast(cast(new."ZnRPid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRoleid" is null then '' else '"' || cast(cast(new."ZnRoleid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nRPid" is null then '' else '"' || replace(replace(cast(old."nRPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPMid" is null then '' else '"' || cast(cast(old."nPMid" as numeric) as varchar) || '"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dModifydt" is null then '' when isfinite(old."dModifydt") then '"' || to_char(old."dModifydt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nORPid" is null then '' else '"' || cast(cast(old."nORPid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRoleid" is null then '' else '"' || replace(replace(cast(old."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRPid" is null then '' else '"' || cast(cast(old."ZnRPid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRoleid" is null then '' else '"' || cast(cast(old."ZnRoleid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RolePermission',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      228,                                                                                                                                             
                                      
          case when old."nRPid" is null then '' else '"' || replace(replace(cast(old."nRPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rolepermission',                                                                                                                                                
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
