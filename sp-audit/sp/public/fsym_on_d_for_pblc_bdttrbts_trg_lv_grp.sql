CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bdttrbts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BDAttributes',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      233,                                                                                                                                             
                                      
          case when old."nBDAid" is null then '' else '"' || replace(replace(cast(old."nBDAid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBDAid" is null then '' else '"' || replace(replace(cast(old."nBDAid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPageposition" is null then '' else '"' || replace(replace(cast(old."cPageposition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nStartfrom" is null then '' else '"' || cast(cast(old."nStartfrom" as numeric) as varchar) || '"' end||','||
          case when old."jPagination" is null then '' else '"' || replace(replace(cast(old."jPagination" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDescription" is null then '' else '"' || replace(replace(cast(old."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIsPaginate" is null then '' when old."cIsPaginate" then '"1"' else '"0"' end||','||
          case when old."pagerotation" is null then '' else '"' || replace(replace(cast(old."pagerotation" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRotate" is null then '' else '"' || cast(cast(old."nRotate" as numeric) as varchar) || '"' end||','||
          case when old."bIsconvert" is null then '' else '"' || replace(replace(cast(old."bIsconvert" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cFVer" is null then '' else '"' || replace(replace(cast(old."cFVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLVer" is null then '' else '"' || replace(replace(cast(old."cLVer" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nEStatus" is null then '' else '"' || cast(cast(old."nEStatus" as numeric) as varchar) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nConvertid" is null then '' else '"' || replace(replace(cast(old."nConvertid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPtaskid" is null then '' else '"' || replace(replace(cast(old."nPtaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDAid" is null then '' else '"' || cast(cast(old."ZnBDAid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnConvertid" is null then '' else '"' || cast(cast(old."ZnConvertid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPtaskid" is null then '' else '"' || cast(cast(old."ZnPtaskid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_bdattributes',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
