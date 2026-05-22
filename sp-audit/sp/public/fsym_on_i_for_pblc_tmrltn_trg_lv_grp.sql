CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_tmrltn_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'TeamRelation',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      219,                                                                                                                                             
                                      
          case when new."nTRid" is null then '' else '"' || replace(replace(cast(new."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nOTRid" is null then '' else '"' || cast(cast(new."nOTRid" as numeric) as varchar) || '"' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dModifyDt" is null then '' when isfinite(new."dModifyDt") then '"' || to_char(new."dModifyDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRoleid" is null then '' else '"' || replace(replace(cast(new."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTeamid" is null then '' else '"' || replace(replace(cast(new."nTeamid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRoleid" is null then '' else '"' || cast(cast(new."ZnRoleid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTRid" is null then '' else '"' || cast(cast(new."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTeamid" is null then '' else '"' || cast(cast(new."ZnTeamid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_teamrelation',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
