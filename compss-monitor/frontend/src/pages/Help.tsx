import {
  HelpCircle,
  BookOpen,
  Waypoints,
  Monitor as MonitorIcon,
  ServerCog,
  SlidersHorizontal,
  Terminal,
  AlertTriangle,
  LifeBuoy,
  GitCompareArrows as GitlabIcon, // si prefieres, cambia por un svg del logo GitLab
  BookText,
} from "lucide-react";
import StickerPeel from "../components/visual/StickerPeel";

const SUPPORT_EMAIL = "support-compss@bsc.es"; // ← cámbialo
const GITHUB_REPO = "https://gitlab.com/tu-grupo/tu-repo"; // ← cámbialo
const COMPSS_DOC = "https://compss-doc.readthedocs.io/en/stable/"; // ← cámbialo

export default function Help() {
  return (
    <div className="mx-auto max-w pl-4 pr-8 h-[80vh] ">
      {/* Header */}
      <header className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Help & Documentation</h1>
          <p className="text-sm text-neutral-500">
            How to use the COMPSs Manager: workspaces, agents, operations and monitors.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-6">
        {/* TOC (sticky on large) */}
        <aside className="hidden lg:block w-50">
          <nav className="sticky top-16">
            <div className="text-xs font-medium text-neutral-500 mb-2">Contents</div>
            <ul className="space-y-2 text-sm">
              <TocLink href="#intro" label="Overview" />
              <TocLink href="#local-monitor" label="Local Monitor" />
              <TocLink href="#workspaces" label="Workspaces" />
              <TocLink href="#agents" label="Agents" />
              <TocLink href="#agent-details" label="Agent Details" />
              <TocLink href="#resources" label="Resources (Local/External)" />
              <TocLink href="#operations" label="Call Operation" />
              <TocLink href="#agents-monitor" label="Agents Monitor" />
              <TocLink href="#troubleshooting" label="Troubleshooting" />
              <TocLink href="#faq" label="FAQ" />
              <TocLink href="#support" label="Support" />
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="space-y-8">
          {/* Overview */}
          <Section id="intro" title="Overview" icon={<BookOpen className="h-5 w-5" />}>
            <p className="text-sm">
              This is a <strong>monitoring</strong> tool for local and agent <strong>COMPSs</strong> executions, which also doubles  
              as an agents manager. Through the different monitors, you can follow the events of
              an execution or the state of your agents in real time. Furthermore, this tool provides
              an accessible way to <strong>manage</strong> your agents' resources and send operations to them.
            </p>
          </Section>

          <h1 className="font-bold text-gray-400 text-3xl">LOCAL</h1>
          <Section id="local-monitor" title="Local Monitor" icon={<MonitorIcon className="h-5 w-5" />}>
            <p className="text-sm">
              The local monitor section does not require any workspace to function. Simply start a COMPSs execution in
              your local machine with the designated flag to enable monitoring, and you will begin to see the state and 
              events in the Local Monitor Dashboard. Within the dashboard, you can view the following metrics and traces:
            </p>
            <ul className="text-sm list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>CPU Usage</strong> and <strong>Memory Usage</strong> shows the state of the cpu load and memory 
                load in the execution.
              </li>
              <li>
                <strong>Runtime State:</strong> the state of the main runtime threads AP (Access Processor) and TD (Task Dispatcher).
              </li>
              <li>
                <strong>Executor State:</strong> the state of the executor threads.
              </li>
              <li>
                <strong>Executor Tasks:</strong> the tasks that the executors are running.
              </li>
            </ul>
            <p className="text-sm">
              You are free to zoom, move and resize all the components from the monitor. When you refresh everything goes back to normal.
            </p>
          </Section>
          <h1 className="font-bold text-gray-400 text-3xl">AGENTS</h1>
          {/* Workspaces */}
          <Section id="workspaces" title="Workspaces" icon={<Waypoints className="h-5 w-5" />}>
            <ol className="space-y-2 text-sm list-decimal pl-5">
              <li>
                If no workspace is selected, you will see the <em>elect Workspace</em> screen. If none exist, create one 
                with <strong>New workspace</strong>.
              </li>
              <li>
                The name of the current workspace appears at the <strong>Topbar</strong> (right). Click to open the menu: <em>New</em>
                , <em>Change</em> y <em>Delete</em>.
              </li>
              <li>
                To <strong>delete</strong> a workspace, a confirmation modal opens: write the name exactly and confirm. You will be redirected to select workspace.
              </li>
            </ol>
            <Callout>
              The web stores the selected workspace, and hides content if there is none active.
            </Callout>
          </Section>

          {/* Agents */}
          <Section id="agents" title="Agent Manager" icon={<ServerCog className="h-5 w-5" />}>
            <p className="text-sm mb-2">
              In <strong>Agent Manager</strong> you can register and search agents by name, IP, ports, etc.
            </p>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>
                <strong>New</strong> opens a modal to register an agent: <code>label</code>, <code>agent_id</code> (IP/host),
                ports (<code>rest</code>, <code>comm</code>, <code>events</code>, <code>metrics</code>).
              </li>
              <li>
                The page lists registered agents' cards with an <em>online/offline</em> status (checked every 5 seconds)
              </li>
              <li>
                Click a card to open <strong>Agent Details</strong>.
              </li>
            </ul>
          </Section>

          {/* Agent details */}
          <Section id="agent-details" title="Agent Details" icon={<SlidersHorizontal className="h-5 w-5" />}>
            <p className="text-sm mb-2">
              View with tabs: <strong>Basic Info</strong>, <strong>Local Resources</strong>,{" "}
              <strong>External Resources</strong> y <strong>Call Operation</strong>, the agent needs to be up and 
              accessible to be able to use the last 3 tabs.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-2">
              <li>
                <strong>Basic Info:</strong> edit the agent's filled information.
              </li>
              <li>
                <strong>Local Resources:</strong> view and adjust the agent's local resources.
              </li>
              <li>
                <strong>External Resources:</strong> view and adjust the agent's exteral resources.
              </li>
              <li>
                <strong>Call Operation:</strong> execute an operation on the agent. 
              </li>
              <li>
                <strong>Delete Agent:</strong> delete the agent from the workspace using the button in this view.
              </li>
            </ul>
          </Section>

          {/* Resources */}
          <Section id="resources" title="Resources (Local / External)" icon={<ServerCog className="h-5 w-5" />}>
            <p className="text-sm">
              The resource tabs allow you to <strong>view</strong> and <strong>adjust</strong> the resources of an agent.
            </p>

            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <Card title="Local Resources">
                <ul className="text-sm list-disc pl-5 space-y-2">
                  <li>
                    This tab displays the <strong>local resources</strong> of the agent — that is, the resources directly available
                    on the machine where the agent is running (CPU, GPU, memory, storage, OS, etc.).
                  </li>
                  <li>
                    You can edit these resources using the <strong>Adjust</strong> panel.
                  </li>
                </ul>
              </Card>

              <Card title="External Resources">
                <ul className="text-sm list-disc pl-5 space-y-2">
                  <li>
                    This tab lists <strong>external resources</strong> — other agents or machines that can be used by the selected
                    agent to execute tasks.
                  </li>
                  <li>
                    You can assign <strong>registered agents</strong> in the current workspace as external resources, allowing
                    multiple agents to collaborate during execution.
                  </li>
                </ul>
              </Card>
            </div>
          </Section>

          {/* Call Operation */}
          <Section id="operations" title="Call Operation" icon={<Terminal className="h-5 w-5" />}>
            <p className="text-sm">
              Send a program to execute on an agent.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Languages:</strong> <code>JAVA</code> or <code>PYTHON</code>.
              </li>
              <li>
                <strong>Class name:</strong> for Java, specify the full class name (e.g., <code>com.example.Main</code>).  
                For Python, specify the script file (e.g., <code>script.py</code>); the backend automatically trims the “.py” suffix.
              </li>
              <li>
                <strong>Parameters:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <em>Simple:</em> provide one argument per line. Optionally enable <strong>“Send as array (main(String[]))”</strong> to
                    pass them as an array to the main method.
                  </li>
                  <li>
                    <em>Raw XML:</em> paste a valid <code>&lt;parameters&gt;</code> block for advanced configurations.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Advanced (stop / forward):</strong> optional fields to stop the execution or forward it to another agent.
              </li>
              <li>
                The file or class being executed must exist in the agent’s scope to be successfully launched.
              </li>
            </ul>

          </Section>

          {/* Monitors */}
          <Section id="agents-monitor" title="Agents Monitor" icon={<MonitorIcon className="h-5 w-5" />}>
            <p className="text-sm">
              The Agents Monitor section provides a real-time overview of all registered agents within the selected workspace.
              Each agent has its own dashboard, displaying the same monitoring views as in the Local Monitor.
            </p>
            <p className="text-sm mt-2">
              These dashboards allow you to track the runtime and executor activity of each agent individually. The following
              views are available for every registered agent:
            </p>

            <ul className="text-sm list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>CPU Usage</strong> and <strong>Memory Usage:</strong> show the current CPU load and memory usage on the
                agent’s host machine.
              </li>
              <li>
                <strong>Runtime State:</strong> displays the status of the agent’s main runtime threads (AP - Access Processor,
                TD - Task Dispatcher).
              </li>
              <li>
                <strong>Executor State:</strong> indicates the state of each executor thread managed by the agent.
              </li>
              <li>
                <strong>Executor Tasks:</strong> lists the tasks currently being executed by the agent’s executors.
              </li>
              <li>
                <strong>Executors API State:</strong> shows the operational status of the executor API, whether it is active,
                busy, or awaiting new tasks. This provides insight into the health of the communication between the runtime
                and the worker components.
              </li>
            </ul>

            <p className="text-sm mt-2">
              Each of these views is automatically generated for every agent in the workspace, allowing you to easily compare
              resource usage and runtime performance across multiple agents.
            </p>
          </Section>

          {/* Troubleshooting */}
          <Section id="troubleshooting" title="Troubleshooting" icon={<AlertTriangle className="h-5 w-5" />}>
            <div className="space-y-3 text-sm">
              <Trouble
                title="Grafana: Data does not have a time field"
                tip="Grafana is not receiving metrics or events because the agent is either down, misconfigured, or there are no events within the selected time range."
              />
              <Trouble
                title="Agent not online"
                tip="Check the provided IP and ports, and make sure the agent is running and reachable from your computer."
              />
              <Trouble
                title="Workspace not loaded"
                tip="The workspace configuration could not be fetched. Verify that the backend is running and the workspace ID is valid."
              />
              <Trouble
                title="Unable to add external resources"
                tip="To 'Add external' you will need the ip of a Worker and its commPort. If us select a registered agent, the form will autofill its ip and port."
              />
              <Trouble
                title="Monitor: Request failed with status code 500"
                tip="Grafana is not loading, check that the service is started and give it some seconds before refreshing."
              />
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="FAQ" icon={<HelpCircle className="h-5 w-5" />}>
            <dl className="divide-y">
              <Faq q="Can I use the app without selecting a workspace?">
                No. The app is workspace-oriented. You must first create or select one.
              </Faq>
              <Faq q="What is the difference between local and external resources?">
                The local resource refers to the master node itself (<em>COMPSsMaster</em> adaptor).  
                External resources are typically additional workers (<em>CommAgentWorker</em>), which often correspond to other registered agents.
              </Faq>
              <Faq q="Which languages does Call Operation support?">
                Java and Python for now.  
                For Python, you can specify a <code>script.py</code> and its arguments;  
                for Java, use the <code>className</code> and method (by default <code>main</code>).
              </Faq>
            </dl>
          </Section>

          {/* Support */}
          <Section id="support" title="Support" icon={<LifeBuoy className="h-5 w-5" />}>
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <a
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-neutral-50"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                <LifeBuoy className="h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-neutral-50"
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
              >
                <GitlabIcon className="h-4 w-4" />
                Github Repository
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-neutral-50"
                href={COMPSS_DOC}
                target="_blank"
                rel="noreferrer"
              >
                <BookText className="h-4 w-4" />
                COMPSs Documentation
              </a>
            </div>
            <p className="text-xs text-neutral-500 mt-2 pb-4">
              Please, include your version, relevant logs and steps to reproduce the problem.
            </p>
          </Section>
        </main>
        <StickerPeel
            imageSrc={'/src/assets/compss-sticker.png'}
            width={80}
            rotate={-10}
            peelBackHoverPct={10}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 0, y: 360 }}
          />
          <StickerPeel
            imageSrc={'/src/assets/node-sticker.png'}
            width={70}
            rotate={10}
            peelBackHoverPct={20}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 110, y: 400 }}
          />
          <StickerPeel
            imageSrc={'/src/assets/react-sticker.png'}
            width={70}
            rotate={10}
            peelBackHoverPct={20}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 10, y: 460 }}
          />
          <StickerPeel
            imageSrc={'/src/assets/grafana-sticker.png'}
            width={80}
            rotate={10}
            peelBackHoverPct={20}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 100, y: 490 }}
          />
          <StickerPeel
            imageSrc={'/src/assets/prometheus-sticker.png'}
            width={80}
            rotate={10}
            peelBackHoverPct={10}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 0, y: 570 }}
          />
          <StickerPeel
            imageSrc={'/src/assets/otel-sticker.png'}
            width={80}
            rotate={10}
            peelBackHoverPct={20}
            peelBackActivePct={80}
            shadowIntensity={0.001}
            lightingIntensity={0.01}
            initialPosition={{ x: 100, y: 620 }}
          />
        <StickerPeel
            imageSrc={'/src/assets/bsc-sticker.png'}
            width={200}
            rotate={10}
            peelBackHoverPct={2}
            peelBackActivePct={80}
            shadowIntensity={0.5}
            lightingIntensity={0.01}
            initialPosition={{ x: 0, y: 720 }}
          />
          
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function TocLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} className="text-neutral-700 hover:text-black hover:underline">
        {label}
      </a>
    </li>
  );
}

function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="text-sm space-y-2">{children}</div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 border border-blue-200 bg-blue-50 text-blue-800 rounded-md px-3 py-2 text-sm">
      {children}
    </div>
  );
}

function Trouble({ title, tip }: { title: string; tip: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="font-medium">{title}</div>
      <div className="text-neutral-600 mt-1">{tip}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <dt className="font-medium">{q}</dt>
      <dd className="text-sm text-neutral-700 mt-1">{children}</dd>
    </div>
  );
}
