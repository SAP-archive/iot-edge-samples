package com.sap.edge.analytics;

import java.util.ArrayList;
import java.util.Map;

public class CclGen 
{
	private static final String ST = "STREAM";
	private static final String RT = "_CALC";
	private static String INTERFACE = "CREATE Schema InputStreamSchema (\n" + 
			"	 DeviceId string,\n" + 
			"    DeviceTag string,\n" + 
			"    SensorId string,\n" + 
			"    SensorTag string,\n" + 
			"    SensorProfileId string,\n" + 
			"    SensorReadingValue string,\n" + 
			"    Context string,\n" + 
			"    DateCreated msdate ) ;\n" + 
			"\n" + 
			"CREATE Schema OutputStreamSchema (\n" + 
			"    DeviceId string,\n" + 
			"    DeviceTag string,\n" + 
			"    SensorId string,\n" + 
			"    SensorTag string,\n" + 
			"    SensorProfileId string,\n" + 
			"    SensorReadingValue string,\n" + 
			"    DateCreated msdate,\n" + 
			"    RuleId string ); \n" + 
			"\n" + 
			"CREATE Schema OutputPersistSchema ( \n"+
			"	    DeviceId string,\n"+
			"	    DeviceTag string,\n" +
			"	    SensorId string,\n" +
			"	    SensorTag string,\n" +
			"	    SensorProfileId string,\n" +
			"	    Measure double,\n" +
			"	    DateCreated  seconddate,\n" +
			"	    PropertyName string,\n" +
			"	    AggregationType string );\n" +
			"\n" +	    
			"	CREATE Schema ProfileRulesSchema (\n" +
			"	    Operation string,\n" +
			"	    SensorProfileId string,\n" +
			"	    RuleId  string);\n" +
			"CREATE INPUT STREAM isCustomSL SCHEMA InputStreamSchema;\n" +
			"CREATE INPUT WINDOW ProfileRules SCHEMA ProfileRulesSchema PRIMARY KEY (Operation, SensorProfileId, RuleId) KEEP ALL;\n";
	
	private static String AVG_S = "CREATE OUTPUT WINDOW AVG_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId SensorProfileId,\n" + 
			" avg(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId\n" + 
			";";
	
	private static String SUM_S = "CREATE OUTPUT WINDOW SUM_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" sum(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String COUNT_S = "CREATE OUTPUT WINDOW COUNT_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" count(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MIN_S = "CREATE OUTPUT WINDOW MIN_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" min(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MAX_S = "CREATE OUTPUT WINDOW MAX_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" max(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MEDIAN_S = "CREATE OUTPUT WINDOW MEDIAN_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" median(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String SDDEV_S = "CREATE OUTPUT WINDOW SDDEV_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" stddev_samp(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String COUNTDISTINCT_S = "CREATE OUTPUT WINDOW COUNTDISTINCT_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" count(distinct isCustomSL.SensorReadingValue) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String WEIGHTEDAVG_S = "CREATE OUTPUT WINDOW WEIGHTEDAVG_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" weighted_avg(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String FIRSTVALUE_S = "CREATE OUTPUT WINDOW FIRSTVALUE_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" first(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String LASTVALUE_S = "CREATE OUTPUT WINDOW LASTVALUE_CALC\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" last(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String AVG = "CREATE OUTPUT WINDOW AVGSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId SensorProfileId,\n" + 
			" avg(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId\n" + 
			";";
	
	private static String SUM = "CREATE OUTPUT WINDOW SUMSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" sum(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String COUNT = "CREATE OUTPUT WINDOW COUNTSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" count(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MIN = "CREATE OUTPUT WINDOW MINSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" min(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MAX = "CREATE OUTPUT WINDOW MAXSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" max(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String MEDIAN = "CREATE OUTPUT WINDOW MEDIANSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" median(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String SDDEV = "CREATE OUTPUT WINDOW SDDEVSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" stddev_samp(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String COUNTDISTINCT = "CREATE OUTPUT WINDOW COUNTDISTINCTSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" count(distinct isCustomSL.SensorReadingValue) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String WEIGHTEDAVG = "CREATE OUTPUT WINDOW WEIGHTEDAVGSTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" weighted_avg(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String FIRSTVALUE = "CREATE OUTPUT WINDOW FIRSTVALUESTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" first(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String LASTVALUE = "CREATE OUTPUT WINDOW LASTVALUESTREAM\n" + 
			"PRIMARY KEY DEDUCED \n" + 
			"KEEP ALL\n" + 
			"AS SELECT now() ProcessTime, isCustomSL.DeviceId DeviceId, isCustomSL.DeviceTag, isCustomSL.SensorId SensorId, isCustomSL.SensorTag, isCustomSL.SensorProfileId,\n" + 
			" last(to_float(isCustomSL.SensorReadingValue)) Measure \n" + 
			"FROM isCustomSL KEEP EVERY 1 SECONDS\n" + 
			"GROUP BY isCustomSL.DeviceId, isCustomSL.SensorId, isCustomSL.SensorProfileId;";
	
	private static String S_FLEX_HDR = "CREATE FLEX osCustomSLF\n";
	
	private static String S_FLEX_IN = "IN ProfileRules, "; /* "AVG_CALC, SUM_CALC\n";*/
	
	private static String S_FLEX_DIC = "OUT OUTPUT STREAM osCustomSL SCHEMA OutputStreamSchema\n" + 
			"BEGIN\n" + 
			"DECLARE\n" + 
			"    dictionary(string, dictionary(string, vector(string))) operationProfileRules;\n" + 
			"    \n" + 
			"    vector(string) getRules(string operation, string profileId) {\n" + 
			"        print('getRules: ', operation, ' : ', profileId, '\\n');\n" + 
			"        dictionary(string, vector(string)) profileRules := operationProfileRules[operation];\n" + 
			"\n" + 
			"        if(not isnull(profileRules)) {\n" + 
			"            vector(string) rules := profileRules[profileId];\n" + 
			"            if(isnull(rules)) {\n" + 
			"               print('rules vector is null for ', profileId);\n" + 
			"            }\n" + 
			"            return profileRules[profileId]; \n" + 
			"        }\n" + 
			"        print('returning null', '\\n');\n" + 
			"        return null;\n" + 
			"    }\n" + 
			"END;\n" + 
			"ON ProfileRules {\n" + 
			"    if (getopcode(ProfileRules) = insert) {\n" + 
			"	print('start ', ProfileRules.Operation, '\\n');\n" + 
			"        dictionary(string, vector(string)) profileRules := operationProfileRules[ProfileRules.Operation];\n" + 
			"        if(isnull(profileRules)) {\n" + 
			"            profileRules := new dictionary(string, vector(string));\n" + 
			"	    print('RiD: ', ProfileRules.RuleId, '\\n');\n" + 
			"            vector(string) rules := new vector(string);\n" + 
			"            push_back(rules, ProfileRules.RuleId);\n" + 
			"            print('PiD: ', ProfileRules.SensorProfileId, '\\n');\n" + 
			"            profileRules[ProfileRules.SensorProfileId] := rules;\n" + 
			"            operationProfileRules[ProfileRules.Operation] := profileRules; \n" + 
			"        } else {\n" + 
			"            print('else: PiD: ', ProfileRules.SensorProfileId, '\\n');\n" + 
			"            vector(string) rules := profileRules[ProfileRules.SensorProfileId];\n" + 
			"            if(isnull(rules)) {\n" + 
			"                print('rules null: ', ProfileRules.RuleId, '\\n');\n" + 
			"                vector(string) rules := new vector(string);\n" + 
			"                push_back(rules, ProfileRules.RuleId);\n" + 
			"                profileRules[ProfileRules.SensorProfileId] := rules;            \n" + 
			"            } \n" + 
			"            else { \n" + 
			"               push_back(rules, ProfileRules.RuleId);\n" + 
			"            }\n" + 
			"        }\n" + 
			"    } \n" + 
			"    else \n" + 
			"    {\n" + 
			"        //Do maintenance of map\n" + 
			"        print('ADJ OPN: ', ProfileRules.Operation, '\\n');\n" + 
			"	dictionary(string, vector(string)) profileRules := operationProfileRules[ProfileRules.Operation];\n" + 
			"        if(not isnull(profileRules)) \n" + 
			"        {\n" + 
			"            print('ADJ PiD: ', ProfileRules.SensorProfileId, '\\n');\n" + 
			"            vector(string) rules := profileRules[ProfileRules.SensorProfileId];\n" + 
			"	    \n" + 
			"	    if (not isnull(rules)) \n" + 
			"            {\n" + 
			"                vector(string) new_rules := new vector(string);\n" + 
			"     		for(rule in rules) \n" + 
			"		{\n" + 
			"                    print('rule: ', rule, ' RuleId: ', ProfileRules.RuleId ,'\\n');\n" + 
			"		    if (rule = ProfileRules.RuleId)\n" + 
			"                    {\n" + 
			"			//Do nothing\n" + 
			"		    }\n" + 
			"                    else\n" + 
			"		    {\n" + 
			"                        print('adding rule in inew_rule: ', rule, '\\n');\n" + 
			" 			push_back(new_rules, rule);\n" + 
			"		    }\n" + 
			"                }\n" + 
			"		profileRules[ProfileRules.SensorProfileId] := new_rules;\n" + 
			"            }\n" + 
			"         }\n" + 
			"    }\n" + 
			"};\n" + 
			"\n";
	
	public static String S_FLEX_CNT = "ON AVG_WINDOW_CALC {\n" + 
			"    typeof(AVG_WINDOW_CALC) inRow := AVG_WINDOW_CALC;\n" + 
			"\n" + 
			"    if(getopcode(inRow) <> update) {\n" + 
			"        //Nohing to do\n" + 
			"        exit;\n" + 
			"    }\n" + 
			"\n" + 
			"    string operationId := 'AVG';\n" + 
			"\n" + 
			"    vector(string) rules := getRules(operationId, inRow.SensorProfileId);\n" + 
			"    if(not isnull(rules)) {\n" + 
			"        for(rule in rules) {\n" + 
			"            print('insert for rule: ', rule, '\\n');\n" + 
			"            output [ | \n" + 
			"                DeviceId = inRow.DeviceId;\n" + 
			"                DeviceTag = inRow.DeviceTag;\n" + 
			"                SensorId = inRow.SensorId;\n" + 
			"                SensorTag = inRow.SensorTag;\n" + 
			"                SensorProfileId = inRow.SensorProfileId;\n" + 
			"                SensorReadingValue = to_string(inRow.Measure);\n" + 
			"                DateCreated = sysseconddate(); \n" + 
			"                RuleId = rule;\n" + 
			"            ];\n" + 
			"        }\n" + 
			"    }\n" + 
			"\n" + 
			"};\n";
	
	public static String P_FLEX_HDR = "CREATE FLEX aggrFlx\n";
	
	public static String P_FLEX_IN = "IN "; /*AVGSTREAM, SUMSTREAM";*/
	
	public static String P_FLEX_DICT = "OUT OUTPUT STREAM osPersist SCHEMA OutputPersistSchema\n" + 
			"BEGIN\n" + 
			"DECLARE\n" + 
			"END;\n";
	
	public static String P_FLEX_CNT = "ON AVGSTREAM {\n" + 
			"    typeof(AVGSTREAM) inRow := AVGSTREAM;\n" + 
			"\n" + 
			"    if(getopcode(inRow) <> delete) {\n" + 
			"        //Nohing to do\n" + 
			"        exit;\n" + 
			"    }\n" + 
			"\n" + 
			"    string operationId := 'AVG';\n" + 
			"\n" + 
			"	output [ | \n" + 
			"        DeviceId = inRow.DeviceId;\n" + 
			"        DeviceTag = inRow.DeviceTag;\n" + 
			"        SensorId = inRow.SensorId;\n" + 
			"        SensorTag = inRow.SensorTag;\n" + 
			"        SensorProfileId = inRow.SensorProfileId;\n" + 
			"        Measure = inRow.Measure;\n" + 
			"        DateCreated = sysseconddate(); \n" + 
			"        PropertyName = '';        \n" + 
			"        AggregationType = operationId;\n" + 
			"    ];\n" + 
			"};\n";
			
	private static boolean ruleExist(Config cfg, String rule)
	{
		ArrayList<Map<String, Object>> rList = (ArrayList<Map<String, Object>>)cfg.rules;
		for (Map<String, Object> rm: rList)
		{
			if (rm.get("aggr") != null && ((String)rm.get("aggr")).equalsIgnoreCase(rule))
			{
				return true;
			}				
		}
		return false;
	}
	
	public static String gen(Config cfg)
	{
		String ret = INTERFACE;
		ArrayList<String> persistStreams = new ArrayList<String> ();
		ArrayList<String> ruleStreams = new ArrayList<String> ();
		ArrayList<Map<String, Object>> streamList = (ArrayList<Map<String, Object>>)cfg.streams;
		if (streamList != null)
		{
			for (Map<String, Object> mm : streamList)
			{
				ret = ret + "\n";
				String type = (String)mm.get("type");
				String time = (String)mm.get("time");
				Boolean persist = (Boolean)mm.get("persist");
				
				if (time.contains("SEC"))
				{
					time = time.replace("SEC", " SEC");
				}
				else if (time.contains("MIN"))
				{
					time = time.replace("MIN", " MIN");
				}
				else if (time.contains("HOUR"))
				{
					time = time.replace("HOUR", " HOUR");
				}
				else
				{
					System.out.println("Time wondow is not recognized. Aggregation will NOT run!");
					return null;
				}
				
				if (type.equals("AVG"))
				{
					if (persist != null && persist)
					{						
						persistStreams.add("AVG" + ST);
						ret = ret + "\n" + AVG.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "AVG"))
					{
						ruleStreams.add("AVG" + RT);
						ret = ret + "\n" + AVG_S.replace("1 SECONDS", time);	
					}
				}
				
				else if (type.equals("SUM"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("SUM" + ST);
						ret = ret + "\n" + SUM.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "SUM"))
					{
						ruleStreams.add("SUM" + RT);
						ret = ret + "\n" + SUM_S.replace("1 SECONDS", time);	
					}
				}
				
				else if (type.equals("MIN"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("MIN" + ST);
						ret = ret + "\n" + MIN.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "MIN"))
					{
						ruleStreams.add("MIN" + RT);
						ret = ret + "\n" + MIN_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("MAX"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("MAX" + ST);
						ret = ret + "\n" + MAX.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "MAX"))
					{
						ruleStreams.add("MAX" + RT);
						ret = ret + "\n" + MAX_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("COUNT"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("COUNT" + ST);
						ret = ret + "\n" + COUNT.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "COUNT"))
					{
						ruleStreams.add("COUNT" + RT);
						ret = ret + "\n" + COUNT_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("MEDIAN"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("MEDIAN" + ST);
						ret = ret + "\n" + MEDIAN.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "MEDIAN"))
					{
						ruleStreams.add("MEDIAN" + RT);
						ret = ret + "\n" + MEDIAN_S.replace("1 SECONDS", time);	
					}
				}
				
				else if (type.equals("SDDEV"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("SDDEV" + ST);
						ret = ret + "\n" + SDDEV.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "SDDEV"))
					{
						ruleStreams.add("SDDEV" + RT);
						ret = ret + "\n" + SDDEV_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("COUNTDISTINCT"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("COUNTDISTINCT" + ST);
						ret = ret + "\n" + COUNTDISTINCT.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "COUNTDISTINCT"))
					{
						ruleStreams.add("COUNTDISTINCT" + RT);
						ret = ret + "\n" + COUNTDISTINCT_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("WEIGHTEDAVG"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("WEIGHTEDAVG" + ST);
						ret = ret + "\n" + WEIGHTEDAVG.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "WEIGHTEDAVG"))
					{
						ruleStreams.add("WEIGHTEDAVG" + RT);
						ret = ret + "\n" + WEIGHTEDAVG_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("FIRSTVALUE"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("FIRSTVALUE" + ST);
						ret = ret + "\n" + FIRSTVALUE.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "FIRSTVALUE"))
					{
						ruleStreams.add("FIRSTVALUE" + RT);
						ret = ret + "\n" + FIRSTVALUE_S.replace("1 SECONDS", time);	
					}
				}
				else if (type.equals("LASTVALUE"))
				{
					if (persist != null && persist)
					{
						persistStreams.add("LASTVALUE" + ST);
						ret = ret + "\n" + LASTVALUE.replace("1 SECONDS", time);
					}	
					if (ruleExist(cfg, "LASTVALUE"))
					{
						ruleStreams.add("LASTVALUE" + RT);
						ret = ret + "\n" + LASTVALUE_S.replace("1 SECONDS", time);	
					}
				}				
			}
		}
		
		// generating flex stream for persistence streams
		if (persistStreams.size() > 0)
		{
			ret = ret + "\n" + P_FLEX_HDR;
			ret = ret + "\n" + P_FLEX_IN;
			
			for (String s: persistStreams)
			{
				ret = ret + s + ", ";
			}
			int in = ret.lastIndexOf(",");
			ret = ret.substring(0, in) + "\n";
			ret = ret + P_FLEX_DICT + "\n";
			
			for (String s: persistStreams)
			{
				String t = P_FLEX_CNT.replaceAll("AVGSTREAM", s);
				ret = ret + "\n" + t;
			}
			
			ret = ret + "\nEND;\n";
		}
		
		// generating flex stream for rule streams
		if (ruleStreams.size() > 0)
		{
			ret = ret + "\n" + S_FLEX_HDR;
			ret = ret + "\n" + S_FLEX_IN;
			
			for (String s: ruleStreams)
			{
				ret = ret + s + ", ";
			}
			int in = ret.lastIndexOf(",");
			ret = ret.substring(0, in) + "\n";
			ret = ret + S_FLEX_DIC + "\n";
			
			for (String s: ruleStreams)
			{
				String t = S_FLEX_CNT.replaceAll("AVG_WINDOW_CALC", s);
				t = t.replaceAll("AVG", s.substring(0, (s.length() - RT.length())));
				ret = ret + "\n" + t;
			}
			ret = ret + "\nEND;\n";
		}
		
		return ret;
	}
	
	public static String getRulesData(Config cfg)
	{
		String t = "<ProfileRules [ESP_OPS=\"u\"]" + " key=\"111\" Operation=\"AVG\" SensorProfileId=\"P101\" RuleId=\"R001\" />\n";
		String ret = "";
		for (Map<String, Object> mm : (ArrayList<Map<String, Object>>)cfg.rules)
		{
			String aggr = (String)mm.get("aggr");
			if (aggr != null)
			{
				String p = t;
				p = p.replace("AVG", aggr);
				p = p.replace("P101", (String)mm.get("profileId"));
				p = p.replace("R001", (String)mm.get("ruleId"));
				ret = ret + p;
			}
		}
		return ret;
	}
	
	public static void main(String[] a) throws Exception
	{
		Config cfg = Config.getConfig("aggr-cnf.json");
		System.out.println(CclGen.gen(cfg));
		System.out.println(getRulesData(cfg));		
	}
}
