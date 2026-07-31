"""Expanded Week 1–7 narrative for the industrial attachment final report.
Content is drawn from the student's weekly logbooks only.
"""


def add_weeks(doc, add_heading_text, add_para, add_bullet):
    # -------------------- WEEK 1 --------------------
    add_heading_text(doc, "Week 1: Foundation Networking and SAP MM Orientation (Week Ending: 06/06/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 1 was my first full working week at Botswana Power Corporation under the "
        "supervision of Mr Tefo Stanley Ramonoko. The week was used to settle into the "
        "workplace and to begin with practical foundation tasks that every IT support "
        "and infrastructure environment still depends on. The main technical theme was "
        "networking through Ethernet cabling. I was involved in preparing and working "
        "with Ethernet cables, learning how a finished patch lead is produced and why "
        "the quality of that lead affects everything that runs over it. This was not "
        "only a demonstration. I followed the procedure for terminating cables with "
        "RJ45 connectors, paying attention to stripping length, wire arrangement, "
        "insertion into the connector and the final crimp.",
        align="justify",
    )
    add_para(
        doc,
        "A large part of the learning was understanding what goes wrong when "
        "termination is rushed or done incorrectly. If the pins are not clamped "
        "correctly, the cable may look finished on the outside while the electrical "
        "path inside is incomplete or intermittent. In practice that shows up as "
        "connectivity problems, unstable network performance, slow links, packet loss "
        "or a complete failure to communicate. Seeing those failure modes explained "
        "beside real cables made the classroom idea of physical layer faults much more "
        "concrete. After termination I participated in testing Ethernet cables with an "
        "RJ45 cable tester. The purpose of testing was to verify that all wire "
        "connections were properly terminated and functioning as expected before a "
        "cable would be trusted in the workplace. The tester made it possible to "
        "confirm continuity and to identify wiring faults instead of discovering them "
        "only after a user reports that a link does not work.",
        align="justify",
    )
    add_para(
        doc,
        "The second major part of Week 1 was an introduction to Systems Application and "
        "Products in Data Processing, known as SAP, with particular focus on the SAP "
        "Materials Management module used at Botswana Power Corporation. I was shown "
        "the system interface, basic navigation and key functionalities relevant to "
        "materials and related organisational processes. Through this introduction I "
        "learnt how SAP supports business operations by managing and processing "
        "organisational data, improving efficiency and facilitating administrative and "
        "operational tasks. This was my first close look at an enterprise resource "
        "planning system in a live utility setting rather than as a textbook diagram. "
        "It helped me see that the same organisation that needs reliable Ethernet "
        "cabling also depends on shared application data for materials and purchasing "
        "related work.",
        align="justify",
    )
    add_para(
        doc,
        "Taken together, Week 1 connected infrastructure and enterprise applications. "
        "I began to understand the relationship between information technology "
        "infrastructure and business operations, and I saw how networking concepts and "
        "enterprise software systems studied at university appear together in one "
        "workplace. The week ended with clear next objectives: work on an automation "
        "project and research and create workflow using Power Automate, which carried "
        "directly into Week 2.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "Ethernet cable termination and testing stood out because small physical "
        "mistakes have large operational effects. Learning how cables are terminated "
        "using RJ45 connectors emphasised the importance of arranging wires according "
        "to the correct wiring standard. Understanding incorrectly clamped pins helped "
        "explain real symptoms such as slow connection, packet loss or complete "
        "communication failure. Using the RJ45 cable tester showed a disciplined way "
        "to identify wiring faults and verify that cables function correctly before "
        "deployment rather than after users are affected.",
        align="justify",
    )
    add_para(
        doc,
        "SAP software at Botswana Power Corporation, particularly SAP MM, was equally "
        "important. Learning to navigate the SAP environment, understanding its role in "
        "managing organisational data, and observing how it improves efficiency, data "
        "accuracy and coordination across departments gave me a first map of how "
        "enterprise systems sit at the centre of corporate operations. The application "
        "of theory in a workplace environment was itself an item of special interest "
        "because it showed the gap between knowing a concept and performing the task "
        "under workplace expectations.",
        align="justify",
    )

    add_heading_text(doc, "Experience and Knowledge Gained", level=3)
    add_para(
        doc,
        "During this week I gained practical experience in basic networking, "
        "specifically in the installation mindset around termination and testing of "
        "Ethernet cables. I learnt the correct procedure for arranging and clamping "
        "wires into RJ45 connectors and understood the impact of incorrectly clamped "
        "pins on network connectivity and performance. Using an RJ45 cable tester, I "
        "developed skills in identifying wiring faults and verifying that network "
        "cables were functioning properly. This practical experience strengthened my "
        "understanding of networking concepts learnt in class.",
        align="justify",
    )
    add_para(
        doc,
        "I was also introduced to the SAP MM module and learnt how to navigate the "
        "system, access different areas and understand its role in managing "
        "organisational data and business processes. That provided valuable insight "
        "into how enterprise resource planning systems are used in a professional "
        "environment to improve efficiency, accuracy and decision making. By week end "
        "I had successfully gained hands on experience in basic networking tasks, "
        "particularly testing of Ethernet cables, improved understanding of how proper "
        "pin clamping supports stable connectivity, and a working familiarity with the "
        "basic SAP interface and its operational purpose.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 1", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 1 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 2 --------------------
    add_heading_text(doc, "Week 2: Automation Strategy, Migration Planning and SAP Purchase Requisitions (Week Ending: 12/06/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 2 shifted from foundation hardware and SAP orientation into automation "
        "strategy and data migration planning. The week was largely research and "
        "structured planning, but it was practical planning meant to guide later builds "
        "and transfers. Work focused on how to treat different classes of data before "
        "choosing tools. Master data was approached as once off or carefully controlled "
        "reference loads. Transactional data was treated as ongoing updates that keep "
        "changing with business activity. Reports were treated as a separate reporting "
        "layer rather than as the same object as the source data. Automation was aimed "
        "at removing repeatable manual flow, not at automating every small action "
        "staff already finish quickly.",
        align="justify",
    )
    add_para(
        doc,
        "A decision flow was documented to keep the strategy honest. Tasks taking less "
        "than about five minutes should usually stay manual. Tasks that take more than "
        "five minutes, or that repeat at high volume, are candidates for automation. "
        "This simple rule mattered because it is easy to spend more time building a "
        "flow than the manual task ever cost. The framework helped target effort where "
        "manual work creates real delay or risk, while avoiding over engineering of "
        "tiny jobs.",
        align="justify",
    )
    add_para(
        doc,
        "For data movement, we explored the recommended approach of using the "
        "SharePoint Migration Tool for bulk transfer of data rather than using Power "
        "Automate for the initial move, then applying Power Automate afterwards. This "
        "distinction became one of the most important planning outcomes of the week. "
        "SPMT, available through the Microsoft 365 admin centre context, is built for "
        "volume, can preserve structure where configured, and produces migration "
        "reports. In practice a bulk migration of DocuSign Envelopes content was "
        "observed moving from the network share on gab-cp-dcsign-1 into the SharePoint "
        "docusignenvelopes library, which confirmed why volume tools matter when "
        "hundreds of thousands of items are involved. Power Automate is better after "
        "the bulk move, for example when documents need summarising or when smaller "
        "ongoing processes are required. A cloud flow titled Summarize Uploaded "
        "Documents was prepared and marked ready for testing during this period. "
        "Trying to force mass copy jobs through flows often leads to timeout failures, "
        "throttling and partial transfers. Separating bulk migration from post "
        "migration enrichment therefore reduced technical risk before any production "
        "move.",
        align="justify",
    )
    add_para(
        doc,
        "Power BI was also explored for cleaning, trimming and presenting migrated and "
        "survey data, including import mode thinking for clearer dashboards and "
        "filtering. In Power Query, steps such as trimming text, removing blank rows "
        "and standardising business unit names make a dataset easier to model. The "
        "point was not only to create charts. It was to prepare data so that management "
        "can trust and navigate what they see. In addition I learnt how to create a "
        "Purchase Requisition on SAP. The standard path focused on the relevant "
        "transaction, often ME51N, entering material or free text line items, quantity, "
        "plant, delivery date and account assignment, attaching justification where "
        "required, checking approval or budget expectations, then saving and noting the "
        "PR number for tracking through approval and conversion toward a purchase "
        "order. Exact fields and approval rules depend on BPC’s SAP configuration, so "
        "the learning emphasised the organisational path rather than memorising one "
        "generic screen only.",
        align="justify",
    )
    add_para(
        doc,
        "Infrastructure work continued through server troubleshooting, remote desktop "
        "access to systems on physical enclosures or data centre hardware, boot and "
        "connectivity issues, and DNS as part of environment checks. DNS work related "
        "to name resolution for servers and services, confirming hostnames resolve "
        "correctly, checking whether records point to the right addresses, and ruling "
        "out DNS when remote desktop or application access fails. Server "
        "troubleshooting covered verifying that a physical or virtual host is powered "
        "and reachable, using Remote Desktop to the correct hostname or address, "
        "checking network path and firewall related concerns, and distinguishing "
        "issues on a digital or virtual server hosted inside a physical enclosure from "
        "issues in the guest operating system alone. Overall, Week 2 defined when to "
        "automate, which tools to use for bulk versus post migration work, how to "
        "surface data in Power BI, how SAP procurement requisitions are raised, and "
        "how to approach baseline server and DNS troubleshooting before building flows "
        "or moving production data.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "Bulk migration versus post migration automation was a major finding. Power "
        "Automate should not carry the initial bulk move of large files and libraries. "
        "SPMT is the stronger first tool, while Power Automate adds value after the "
        "bulk move. Power BI for clean presentation was flagged as the way to turn raw "
        "or wide survey data into something usable for management. SAP Purchase "
        "Requisition practice was special because it linked enterprise process "
        "knowledge to an actual transaction path used in the organisation. DNS and "
        "server or data centre troubleshooting were special because access problems "
        "that look like application faults are often name resolution, path or host "
        "reachability problems underneath.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "On automation the main takeaway was how to classify work before automating "
        "it. On Microsoft 365 migration, experience was gained in separating bulk "
        "transfer from post migration enrichment. On Power BI, learning focused on "
        "preparing data for reporting rather than only building visuals. On SAP, "
        "knowledge was gained on creating a PR, entering line items, quantities, "
        "plant, delivery dates and account assignment, saving the PR and tracking it "
        "through approval and purchase order conversion. Achievements of the week "
        "included a clear automation framework, an end to end migration approach "
        "definition, and a clearer reporting direction through Power BI research on "
        "cleaning and trimming data. These planning outputs became the foundation for "
        "the dashboard and flow testing work that followed in Week 3.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 2", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 2 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 3 --------------------
    add_heading_text(doc, "Week 3: Power BI Survey Dashboard Development and Power Automate Trigger Testing (Week Ending: 19/06/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 3 turned the planning from Week 2 into concrete delivery and testing. "
        "The work focused on Power BI development and Power Automate testing. I first "
        "cleaned and trimmed the survey data that had been collected so that the "
        "dataset would be fit for visualisation. Cleaning was not treated as a minor "
        "pre step. It was necessary so that business unit names, blank rows and untidy "
        "text would not distort filters, relationships and visuals later. After the "
        "data was prepared I built a dashboard on Power BI to visualise the survey "
        "results for end users.",
        align="justify",
    )
    add_para(
        doc,
        "A deliberate design choice shaped the dashboard. Rather than spreading the "
        "results across multiple dashboard pages, we made use of Power BI’s modelling "
        "capabilities to group related survey questions together. That made it possible "
        "to consolidate the data into a more streamlined single page view. The goal was "
        "better navigation and easier comparison of related responses without forcing "
        "users to move between several screens to understand one theme. This approach "
        "reduced clutter and made the dashboard more practical for people who need "
        "answers quickly rather than a tour of many pages.",
        align="justify",
    )
    add_para(
        doc,
        "In parallel I tested the Power Automate cloud flow that had been built earlier "
        "as part of the automation work started around Week 1 objectives. The flow was "
        "built successfully in the sense that the design and actions were in place, but "
        "it failed testing because the trigger was not called as expected. That "
        "distinction was important. A flow can look complete in the designer and still "
        "be useless in production if the event that should start it never reaches the "
        "flow. The failure therefore pointed to further investigation of trigger "
        "conditions, permissions, connection setup and whether the triggering event "
        "itself was configured properly before retesting.",
        align="justify",
    )
    add_para(
        doc,
        "By the end of Week 3 there were two clear outcomes. First, a Power BI "
        "dashboard existed to visualise survey data, supported by modelling that grouped "
        "related questions into a cleaner layout. Second, Power Automate testing had "
        "confirmed that build completion is not the same as operational readiness, and "
        "the outstanding defect had been narrowed to the trigger path. That gave a "
        "specific next step instead of a vague statement that automation was not "
        "working.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "The Power BI modelling approach was of special interest because grouping "
        "related survey questions through modelling and relationships proved more "
        "effective than splitting everything across multiple dashboards. It improved "
        "usability and set a pattern that should scale better when datasets grow. Cloud "
        "flow testing findings were also of special interest. The flow’s successful "
        "build combined with a failed trigger test highlighted how important it is to "
        "test beyond the designer canvas, including the real event source, conditions "
        "and permissions that decide whether a run ever starts.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "I gained hands on experience using Power BI modelling to establish "
        "relationships between survey question groups rather than relying on multiple "
        "dashboard pages. That deepened my understanding of how data modelling improves "
        "dashboard efficiency, usability and scalability. Testing the cloud flow "
        "provided practical experience in identifying and diagnosing flow failures "
        "around trigger behaviour. Achievements included successfully building the "
        "survey dashboard, applying modelling to consolidate pages, completing the "
        "flow test far enough to confirm the build was structurally in place, and "
        "pinpointing the trigger area as the root cause zone for follow up. Outstanding "
        "work remained the full resolution and retest of the trigger so the flow can be "
        "considered fully functional.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 3", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 3 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 4 --------------------
    add_heading_text(doc, "Week 4: SAP Integration Research and Safety Culture Dashboard Finalisation (Week Ending: 26/06/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 4 focused on two key areas: SAP integration research and finalising a "
        "Power BI safety culture dashboard. On the SAP side I researched different ways "
        "to automate and integrate with SAP, comparing options instead of assuming one "
        "tool fits every case. The first option was the SAP ERP Connector in Power "
        "Automate Cloud. That approach calls SAP BAPIs or RFCs directly through an on "
        "premises data gateway and is best suited for structured transactions where a "
        "BAPI already exists, such as material master updates, pricing or stock posting "
        "style operations. Because it talks to SAP at an interface level, it is stronger "
        "than screen scraping when the required BAPI is available and IT can support "
        "the gateway path.",
        align="justify",
    )
    add_para(
        doc,
        "The second option was Power Automate Desktop robotic process automation. RPA "
        "automates the SAP GUI by replaying clicks and keystrokes. It is useful for "
        "transactions with no exposed BAPI or where IT cannot expose an API. The "
        "research positioned RPA as a fallback rather than a first choice, because "
        "screen based automation is more fragile when forms, labels or timing change. "
        "The third option was native SAP tools such as LSMW, MM17 or custom BAPI and "
        "ABAP programmes. These run entirely inside SAP with no external platform and "
        "are ideal for pure bulk data loads that do not need to touch outside systems. "
        "They also avoid the on premises data gateway dependency that the cloud "
        "connector route requires.",
        align="justify",
    )
    add_para(
        doc,
        "The research worked through the key decision factors for choosing between "
        "these approaches. The core deciding factor identified was not simply the size "
        "or complexity of the task. It was whether the transaction needs anything from "
        "outside SAP, such as Excel data, Teams approvals or an email trigger, versus "
        "being a fully self contained SAP operation. That single question determines "
        "which of the three paths is appropriate: cloud connector, RPA or native SAP "
        "tools. The result was a simple reusable rule for future automation decisions, "
        "together with a glossary of core SAP terminology including ERP, BAPI, RFC, "
        "RPA, GUI, ABAP, ECC, S/4HANA, LSMW and MM17 to support clearer communication "
        "with SAP facing teams.",
        align="justify",
    )
    add_para(
        doc,
        "Alongside the research, the Near Miss Reporting Executive Safety Culture "
        "Overview Power BI dashboard was reviewed and corrected until it was "
        "finalised. The dashboard represents leading indicators of hazard reporting "
        "behaviour, reporting pressure and Goodhart risk, bringing together a Goodhart "
        "Risk Index breakdown for executive readers. Reviewing it meant more than "
        "checking colours and titles. Calculated indices were cross checked against "
        "underlying data so that anomalies could be caught before leadership used the "
        "numbers. One significant caution was that several units with maximum Goodhart "
        "risk of 100 had relatively low engagement in the underlying department detail "
        "table. That means the risk index may be based on a small sample size and "
        "should be verified before being used to make executive decisions. Negative "
        "scores and other outliers also had to be interpreted carefully rather than "
        "accepted at face value. By week end the dashboard was executive ready, and "
        "four business units showing maximum Goodhart risk scores had been flagged as "
        "an early signal on potential reporting integrity issues.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "SAP integration research was special because it forced a decision framework "
        "instead of tool preference. RPA as fallback, gateway requirements for the "
        "cloud connector, and native SAP tools for self contained bulk work are now "
        "clear distinctions I can reuse. On the Power BI side, low responses despite "
        "high risk scores were of special interest because they showed how a dramatic "
        "metric can mislead if sample size is ignored. That analytical habit is as "
        "important as building the visual itself.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "I deepened my understanding of enterprise integration architecture by "
        "distinguishing genuine API level integration such as BAPI or RFC calls from "
        "surface level automation such as RPA screen replication. I learnt to evaluate "
        "automation options against a decision framework rather than defaulting to the "
        "most familiar tool. I also built foundational SAP literacy that reduces "
        "reliance on others to translate jargon. From the dashboard review I "
        "strengthened data validation and quality assurance skills, improved judgement "
        "on flagging outliers, and gained experience translating a technical dashboard "
        "into an executive ready output. Achievements included completing the three "
        "path SAP integration research, establishing the reusable outside SAP decision "
        "question, compiling a terminology glossary, delivering a practical reference "
        "note, correcting the safety culture dashboard, validating key metrics, "
        "flagging anomalies and identifying units with maximum Goodhart risk for "
        "leadership attention. A learning opportunity still open is going deeper into "
        "how BAPIs are discovered for a given transaction, for example using "
        "transaction SE37 or consulting SAP functional teams, and building more "
        "systematic outlier detection for future dashboards.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 4", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 4 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 5 --------------------
    add_heading_text(doc, "Week 5: KYC Verification Support and SharePoint Desktop Flow Revamp (Week Ending: 03/07/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 5 combined compliance support with deeper automation engineering. Part of "
        "the week was spent supporting the Know Your Customer process by helping "
        "confirm and verify information submitted by staff on their completed KYC "
        "forms. The aim was to ensure that details provided were accurate and complete "
        "before the organisation relied on them. This work was less about writing code "
        "and more about careful checking against expected standards for compliance "
        "related documentation. It showed how IT and administrative verification often "
        "meet in the same operating environment.",
        align="justify",
    )
    add_para(
        doc,
        "Additional time was spent investigating how to enable a smoother connection "
        "between cloud based triggers and desktop based automation steps. Power "
        "Automate Online is strong for event triggers and lighter cloud tasks, while "
        "Power Automate Desktop is better for resource intensive or file system level "
        "operations. Understanding when each platform should lead, and how they can "
        "hand work to each other, was necessary for the SharePoint metadata process "
        "being improved during the same week.",
        align="justify",
    )
    add_para(
        doc,
        "The existing desktop flow used to read file metadata and update the Content "
        "Summary column on SharePoint was revamped. This involved refining the flow’s "
        "logic so that it set the correct library and extraction paths. The automation "
        "was tied directly to the organisation’s DocuSign Envelopes document library "
        "through a path pointing to a specific SharePoint synced directory. The flow "
        "constructs a zip path from the library path and file name, then unzips the "
        "file contents into a temporary extraction folder. That design matters because "
        "incoming files are processed as compressed archives before metadata extraction "
        "rather than as already open documents.",
        align="justify",
    )
    add_para(
        doc,
        "After extraction, the flow does not process every file blindly. It "
        "specifically retrieves files matching the pattern Summary*.pdf so that only "
        "designated summary documents are picked up. A conditional check was built in "
        "so that if SummaryFiles is not empty the flow proceeds with text extraction, "
        "and if no matching file exists it does not continue into failing steps. Text "
        "is extracted from the located PDF and processed into a cleaned text variable, "
        "which then feeds the summary content used to update the Content Summary column "
        "on SharePoint. The output variable structure is tied to Certificate of "
        "Completion context, meaning the summary content relates to completion "
        "certificates within DocuSign envelope records. The revamp therefore improved "
        "how metadata is captured, processed and reflected in the system, with fewer "
        "chances of updating SharePoint from the wrong file or from an empty extraction "
        "result.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "Dynamic library path configuration was special because it showed the "
        "automation is anchored to a real organisational library rather than a generic "
        "sample folder. Zip file handling was special because envelope packages arrive "
        "compressed and must be unpacked before useful content is available. Targeted "
        "retrieval of Summary*.pdf files was a key filtering step. The conditional "
        "logic check protected the flow against missing summary files. Text extraction "
        "and cleaning formed the core mechanism that feeds SharePoint. The Certificate "
        "of Completion output context confirmed that the business meaning of the "
        "automation was specific, not just technical file movement.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "Working on KYC form confirmation provided a better understanding of "
        "verification requirements and data accuracy standards expected in compliance "
        "related documentation, as well as insight into how staff submitted information "
        "is cross checked before being finalised. Exploring integration between Power "
        "Automate Online and Power Automate Desktop offered valuable exposure to how "
        "cloud based flows and desktop based automation complement each other. "
        "Achievements included successfully assisting with KYC validation, identifying "
        "a workable cloud and desktop integration approach, revamping the desktop flow "
        "for metadata reading, implementing the summary file conditional check, "
        "enhancing PDF text extraction and cleaning, and improving the update mechanism "
        "for the SharePoint Content Summary column so extracted summary data is "
        "reflected more accurately and consistently.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 5", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 5 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 6 --------------------
    add_heading_text(doc, "Week 6: DNS Server Upgrade from Windows Server 2016 to Windows Server 2022 (Week Ending: 10/07/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 6 focused on the DNS Server Upgrade project. The project involved "
        "migrating DNS services from an existing Windows Server 2016 environment to a "
        "new Windows Server 2022 platform. Because DNS underpins name resolution for "
        "servers, clients and Active Directory related services, the work had to be "
        "planned and tested carefully. The project began with a thorough assessment and "
        "planning phase in which the current DNS infrastructure was reviewed in detail. "
        "This included a full inventory of existing DNS zones, forwarders and their "
        "configurations, followed by development of a comprehensive upgrade plan and a "
        "corresponding rollback strategy to protect business continuity if unforeseen "
        "issues appeared during migration.",
        align="justify",
    )
    add_para(
        doc,
        "Following planning, attention turned to backup and validation. The existing "
        "DNS configuration was fully backed up to safeguard against data loss, and the "
        "health of Active Directory was verified to confirm that the domain environment "
        "was stable and ready to support the migration. With backups and validation "
        "complete, work proceeded to build the new Windows Server 2022 environment. "
        "That build included applying the latest security and cumulative updates, "
        "joining the new server to the existing Active Directory domain, and installing "
        "the DNS Server role in preparation for hosting migrated DNS services.",
        align="justify",
    )
    add_para(
        doc,
        "The migration phase then began. Existing DNS zones were moved from the legacy "
        "Windows Server 2016 system to the new Windows Server 2022 server. Forwarders "
        "were configured to maintain consistent external name resolution. Replication "
        "between the new and existing DNS servers was validated to confirm that zone "
        "data was propagating correctly across the environment. Because many zones were "
        "Active Directory integrated rather than ordinary primary and secondary file "
        "backed zones, special care was taken to ensure zone data replicated through "
        "Active Directory itself rather than only through traditional zone transfers. "
        "That required attention to replication topology and confirmation that the new "
        "server was correctly positioned within the existing replication scope.",
        align="justify",
    )
    add_para(
        doc,
        "During migration both the Windows Server 2016 and Windows Server 2022 DNS "
        "servers had to run simultaneously to avoid service disruption. Special "
        "attention was given so that DHCP scope options, client DNS settings and domain "
        "controller DNS registrations were not pointed prematurely at the new server "
        "before full validation was complete. External and conditional forwarders "
        "needed precise replication to the new server because any mismatch could cause "
        "intermittent external name resolution failures or confusing split behaviour in "
        "hybrid or cross domain situations. Reverse lookup zones were treated as "
        "critical rather than optional, since they support services that rely on "
        "IP to hostname mapping such as mail related checks, security appliances and "
        "certain authentication mechanisms. Scavenging and aging settings were reviewed "
        "and reapplied carefully so that the new server would not delete records too "
        "early or accumulate stale records. SRV records such as those used for LDAP, "
        "Kerberos and global catalogue location were validated to confirm that domain "
        "controller locator services continued to function after migration. TTL values "
        "and client resolver cache behaviour were considered so that cutover would not "
        "leave clients holding old answers for longer than necessary.",
        align="justify",
    )
    add_para(
        doc,
        "Once migration steps were complete, a structured testing phase confirmed that "
        "the new server functioned as expected. Testing included internal name "
        "resolution, reverse lookup validation, Active Directory integration checks and "
        "client connectivity tests to verify that workstations and servers across the "
        "network could reliably reach and use the new DNS service. Related DNS service "
        "work on host gab-cp-dns-02 also included troubleshooting the Unbound DNS "
        "service. An initial systemctl start failed, the forwarder configuration file "
        "was edited, and the service was then started successfully and confirmed as "
        "active and running. That terminal evidence is included in Appendix B. The "
        "project then moved into cutover and documentation. DNS responsibilities were "
        "formally transferred from Windows Server 2016 to Windows Server 2022. Server "
        "performance was monitored after cutover to catch post migration issues early. "
        "Infrastructure documentation was updated to reflect the new DNS environment so "
        "that future support and troubleshooting would be based on current information. "
        "The rollback plan remained important throughout: the older server was treated "
        "as untouched and usable until the new server had been validated in production "
        "for a defined stabilisation period. Overall, Week 6 marked successful end to "
        "end execution of the DNS migration from assessment through cutover, with "
        "validation at each stage and no disruption to existing services recorded in "
        "the logbook account of the completed work.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "Items of special interest included Active Directory integrated DNS zones, the "
        "coexistence period between old and new servers, forwarder and conditional "
        "forwarder configuration, reverse lookup zones, scavenging and aging settings, "
        "SRV records and Active Directory service location, client resolver cache and "
        "TTL considerations, rollback readiness, and monitoring after cutover. Each of "
        "these mattered because DNS failures rarely stay local. They spread into "
        "authentication, application access and user productivity very quickly.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "This week provided valuable hands on experience across assessment, backup "
        "validation, Windows Server 2022 build differences compared with 2016, AD "
        "integrated zone migration, forwarder reconfiguration, methodical testing and "
        "change controlled cutover. Achievements included a complete inventory of zones "
        "and forwarders, an upgrade plan with rollback strategy, successful backup and "
        "AD health validation, build and domain join of the new server with the DNS "
        "role installed, successful zone migration and replication validation, "
        "successful testing of internal resolution, reverse lookup, AD integration and "
        "client connectivity, formal transfer of DNS responsibilities, post cutover "
        "monitoring and updated documentation. Some internal screenshots could not be "
        "shared outside the organisation, so Appendix evidence for this week may need "
        "redacted or approved substitutes.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 6", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 6 figures.",
        align="justify",
        first_line=False,
    )

    # -------------------- WEEK 7 --------------------
    add_heading_text(doc, "Week 7: Veeam Backup Restore Testing and Telephony 4G CPE Inspection (Week Ending: 16/07/2026)", level=2)

    add_heading_text(doc, "Description of Work Done", level=3)
    add_para(
        doc,
        "Week 7 centred on backup and disaster recovery testing using Veeam Backup and "
        "Replication, together with a physical check of telephony network hardware. "
        "The bulk of the time was spent validating virtual machine restore capability "
        "within Veeam Backup and Replication Build 13.0.1.2067, connected to host "
        "172.16.15.112 and used in the corporate account context recorded in the "
        "logbook. The process began by opening the Restore from Backup wizard and "
        "selecting Entire VM restore from the available options, which also included "
        "Disk restore, Guest Files restore, Application Items restore and Database "
        "restore. Choosing entire virtual machine restore was deliberate because the "
        "goal was to validate recovery of a full DNS server workload, not only selected "
        "files.",
        align="justify",
    )
    add_para(
        doc,
        "From the list of backup jobs, including BPC-VENDING, BPC-Website, DNS SERVERS, "
        "Domain Controllers, Exchange01/02, File Server, Monthly Backups, SAP VM "
        "Backup, SAPSANBOX, TEST JOB and Vending, the DNS SERVERS job was selected. "
        "The target virtual machine was gab-cp-dns-02, using a restore point from "
        "14 July 2026. That choice linked Week 7 directly to the DNS work from Week 6: "
        "after helping migrate DNS services, it was necessary to test whether DNS "
        "virtual machines could be restored from backup if disaster recovery was ever "
        "required.",
        align="justify",
    )
    add_para(
        doc,
        "The destination host was then chosen as bpc-hq-cluster under HQ-DataCenter at "
        "172.16.18.45. Datastore options on gab-cp-esxi-02.corp.bpc.bw were reviewed, "
        "including VM Encryption Policy and default policy settings. The restored "
        "virtual machine was renamed to gab-cp-dns-02-Test to avoid conflicting with "
        "the live production machine. Before running the job, the restore summary was "
        "reviewed to confirm target host, resource pool, target folder, target "
        "datastore and network mapping. Network mapping was deliberately left as Not "
        "connected, and the option to power on after restore was left unchecked. Those "
        "two choices kept the test isolated from the live network so the restored DNS "
        "machine could not clash with production gab-cp-dns-02, which is good restore "
        "testing practice for critical infrastructure roles.",
        align="justify",
    )
    add_para(
        doc,
        "The restore job then began and showed Restoring from StoreOnce. It "
        "successfully restored five files totalling about 20 GB and registered the "
        "virtual machine on the host, but ultimately failed at the step of setting the "
        "storage profile’s VM Encryption Policy. The error indicated that a specified "
        "parameter was not correct in the VM profile specification. This pointed to a "
        "mismatch between the encryption or storage policy expected by the source "
        "backup and the policy available on the destination datastore. The important "
        "learning was that a restore can transfer data successfully and still fail at a "
        "late configuration step. Reading the log carefully made it possible to "
        "isolate that exact point rather than treating the whole job as an unexplained "
        "failure.",
        align="justify",
    )
    add_para(
        doc,
        "Alongside the restore test, wider backup job health was reviewed. The BPC "
        "DAILY BACKUPS job covering 59 objects was observed completing successfully. A "
        "separate BACKUP-SAP Windows Agent Backup job was flagged as failed on its "
        "most recent run, and an email report alert noted that report delivery was "
        "failing due to invalid SMTP credentials. The SMTP problem appeared across "
        "multiple job summaries, indicating an ongoing configuration issue affecting "
        "notification delivery generally rather than one isolated run. That mattered "
        "because broken alerting can hide other failures if staff rely only on email. "
        "The restore source repository used across the DNS SERVERS, daily backups and "
        "SAP related jobs was StoreOnce, and the Veeam environment was running Advanced "
        "edition on the build noted above.",
        align="justify",
    )
    add_para(
        doc,
        "Separately, a physical inspection was carried out on a 4G CPE router or modem "
        "supporting the telephone system, accessed through its local admin interface. "
        "This involved reviewing device details such as IMEI, IMSI, WAN IP address, "
        "signal quality metrics including RSRP and SINR, radio band, and Wi-Fi or LAN "
        "configuration. The check was consistent with troubleshooting or confirming "
        "the health of the cellular backup connection used by the phone system. "
        "Firmware was recorded as BTC S200_1.14.2. An RSRP of about minus 95 dBm with "
        "SINR of 20 on Band 40 was noted. Since about minus 80 to minus 90 dBm is "
        "generally considered good and readings below minus 100 dBm are considered "
        "poor, minus 95 dBm falls into a weaker borderline range that could affect call "
        "quality or connectivity if the phone system relies on that cellular backup "
        "link. The CPE check was performed alongside open sessions for SolarWinds, "
        "Ruckus Wireless and Cisco Unified CM Console, indicating it formed part of a "
        "broader telephony monitoring session. Cross referencing Cisco Unified CM logs "
        "from the same period may help determine whether the recorded signal level "
        "correlates with any reported call issues.",
        align="justify",
    )
    add_para(
        doc,
        "Overall, Week 7 combined hands on disaster recovery testing that surfaced an "
        "encryption policy error requiring follow up, a review of daily backup job "
        "health across several systems including SAP, SQL related and DNS workloads, "
        "and an on site check of the 4G CPE hardware supporting the telephone system. "
        "Outstanding work for the coming period includes resolving the VM Encryption "
        "Policy mismatch and re-running the DNS SERVERS restore test to confirm a full "
        "successful restore.",
        align="justify",
    )

    add_heading_text(doc, "Items of Special Interest", level=3)
    add_para(
        doc,
        "Special interest items included the failed VM restore at encryption policy "
        "application after successful data transfer and registration, the persistent "
        "SMTP reporting failure caused by invalid credentials, deliberate isolation of "
        "the test restore from the production network, StoreOnce repository and Veeam "
        "platform health context, 4G CPE signal strength for the telephone system, and "
        "cross referencing CPE readings with telephony monitoring tools such as "
        "SolarWinds, Ruckus Wireless and Cisco Unified CM.",
        align="justify",
    )

    add_heading_text(doc, "Experience, Achievements and Outstanding Work", level=3)
    add_para(
        doc,
        "The week strengthened technical skills around Veeam based backup and restore "
        "operations and VMware datastore policies, as well as broader operational "
        "skills such as proactive monitoring, methodical log analysis and safe change "
        "isolation in a live enterprise environment. Achievements included configuring "
        "and executing an entire virtual machine restore test end to end under safe "
        "isolation settings, documenting the exact encryption policy failure point, "
        "confirming successful daily backups across 59 objects, identifying the long "
        "failing or disabled SAP agent backup concern and SMTP credential problem, and "
        "recording CPE firmware and signal metrics with a borderline RSRP flagged for "
        "monitoring. The restore workflow itself was sound up to the encryption policy "
        "step, which gives a clear actionable basis for resolution rather than an "
        "unexplained failure.",
        align="justify",
    )

    add_heading_text(doc, "Evidence for Week 7", level=3)
    add_para(
        doc,
        "Workplace photos, system screens and related VS Code method screenshots for this week are placed in Appendix B under the Week 7 figures.",
        align="justify",
        first_line=False,
    )
