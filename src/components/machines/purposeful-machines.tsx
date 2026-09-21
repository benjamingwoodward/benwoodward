/** Purpose-built personal-site artwork; the palette and drafting rules follow the existing machines. */
export type IllustrationId = "financial-systems" | "merchant-connection" | "outbound-system" | "water-measurement" | "prototype-building";
const paper = "var(--bento-machine-paper)";
const shade = "var(--bento-machine-shade)";
const accent = "var(--accent)";

function Pivot({ radius = 5 }: { radius?: number }) {
  return <><circle r={radius} fill={paper} /><circle r="1.4" fill="currentColor" stroke="none" /></>;
}
function DriveWheel({ x, y, name }: { x: number; y: number; name: string }) {
  return <g transform={`translate(${x} ${y})`}><circle r="9" fill={paper} /><g data-art={name}><path d="M0-7V0L6 3.5M0 0L-6 3.5" /><circle r="2" fill={accent} /></g></g>;
}
function Feet({ left = 46, right = 247 }: { left?: number; right?: number }) {
  return <><path d={`M${left} 171V183H${left+13}V171M${right} 171V183H${right+13}V171`} fill={shade} /><path d={`M${left-4} 185H${left+17}M${right-4} 185H${right+17}`} /></>;
}

/** A short, enclosed inspection tunnel. The card is the only travelling payload. */
function InspectionTunnel() {
  return <>
    <path d="M18 185H282" />
    <Feet />
    <path d="M89 67V60L98 51H178L189 62V145H181V69Z" fill={shade} />
    <path d="M102 58H170Q181 58 181 69V145H159V98Q159 90 151 90H120Q112 90 112 98V145H89V71Q89 58 102 58Z" fill={paper} />
    <path d="M112 100L119 93V145H112Z" fill={shade} />
    <rect x="103" y="70" width="64" height="9" rx="2" fill={accent} />
    <circle cx="97" cy="66" r="1.4" fill="currentColor" stroke="none" /><circle cx="174" cy="66" r="1.4" fill="currentColor" stroke="none" />
    <path d="M225 144V106Q225 100 231 100H237V144Z" fill={shade} />
    <rect x="20" y="145" width="260" height="27" rx="13.5" fill={shade} /><path d="M34 149H266M34 168H266" />
    <DriveWheel x={37} y={158.5} name="inspection-drive-left" /><DriveWheel x={263} y={158.5} name="inspection-drive-right" />
    <path d="M64 158H84M96 158H116M128 158H148M160 158H180M192 158H212M224 158H236" strokeOpacity=".45" />
    <g data-art="transaction" style={{ transform: "translate(246px, 120px)" }}>
      <rect width="30" height="24" rx="3" fill={accent} /><rect x="5" y="5" width="8" height="6" rx="1" fill={paper} /><path d="M5 18H24M19 8H24" />
    </g>
    <path d="M89 103H112V145H89ZM159 103H181V145H159Z" fill={paper} stroke="none" />
    <path d="M89 103V145H112V103M159 103V145H181V103M96 108H104M96 114H104M96 120H104M170 128V135" />
    <g data-art="scan" opacity="0"><path d="M114 119H158" stroke={accent} /><path d="M117 116V122M155 116V122" stroke={accent} /></g>
    <g transform="translate(233 105)"><g data-art="inspection-gate" style={{ transform: "rotate(-90deg)" }}>
      <path d="M-3 0H3V37Q3 40 0 40T-3 37Z" fill={paper} /><path d="M-2 14L2 10M-2 27L2 23" />
    </g><Pivot radius={5} /></g>
    <circle data-art="inspection-indicator" cx="173" cy="137" r="2.5" fill={accent} />
  </>;
}

export function dockingAngles(x: number, y: number) {
  const dx = x - 53, dy = y - 138;
  const elbow = Math.acos(Math.max(-1, Math.min(1, (dx*dx + dy*dy - 78*78 - 92*92) / (2*78*92))));
  const shoulder = Math.atan2(dy,dx) - Math.atan2(92*Math.sin(elbow),78+92*Math.cos(elbow));
  return { shoulder: shoulder*180/Math.PI, elbow: elbow*180/Math.PI };
}
function Cartridge() {
  return <><path d="M-15 26L-11 22H11L15 26V40H-15Z" fill={accent} /><path d="M-14 28H14M-8 40V42M0 40V42M8 40V42" /></>;
}
function DockingArm() {
  const rest = dockingAngles(115,80);
  return <g transform="translate(10 16)">
    <path d="M14 169H270M25 167L32 155H81L90 167ZM35 155V143H69V155M40 141V134H63V141" fill={paper} />
    <path d="M29 163H85M44 148H60" />
    <g transform="translate(132 0)"><path d="M-18 157H18L23 167H-23Z" fill={shade} /><path d="M-18 150H18V157H-18Z" fill={paper} /></g>
    <g transform="translate(217 0)"><path d="M-18 157H18L23 167H-23Z" fill={shade} /><path d="M-21 143H-16V152H16V143H21V157H-21Z" fill={paper} /><path d="M-10 163H3" /><circle data-art="connected" cx="12" cy="162" r="1.8" fill={accent} stroke="none" /></g>
    <path d="M236 157V140H244V157" fill={shade} />
    <g transform="translate(132 108)"><g data-art="merchant-waiting" visibility="hidden"><Cartridge /></g></g>
    <g transform="translate(217 108)"><g data-art="merchant-seated"><Cartridge /></g></g>
    <g transform="translate(53 138)"><g data-art="shoulder" style={{ transform:`rotate(${rest.shoulder}deg)` }}>
      <path d="M0-10H64L79-5V5L64 10H0Z" fill={paper} /><Pivot radius={11} />
      <g transform="translate(78 0)"><g data-art="elbow" style={{ transform:`rotate(${rest.elbow}deg)` }}>
        <path d="M-3-8H79L90-3V3L79 8H-3Z" fill={paper} /><path d="M17-4H59V4H17Z" fill={accent} /><Pivot radius={9} />
        <g transform="translate(92 0)"><g data-art="gripper" style={{ transform:`rotate(${-rest.shoulder-rest.elbow}deg)` }}>
          <rect x="-9" y="-6" width="18" height="12" rx="3" fill={shade} /><path d="M-3 6V12H3V6M-12 9H12M-12 9L-15 14V24H-11M12 9L15 14V24H11" />
          <g data-art="merchant-carried" visibility="hidden"><Cartridge /></g>
        </g></g>
      </g></g>
    </g></g>
    <g transform="translate(240 140)"><g data-art="lock" style={{ transform:"rotate(-90deg)" }}><path d="M0 0V-12" /><circle cy="-14" r="2" fill={paper} /></g><Pivot radius={3} /></g>
  </g>;
}

/** A feed hopper, one enclosed folding station and a short delivery belt. */
function Letterpress() {
  return <>
    <path d="M18 185H282" /><Feet left={53} right={239} />
    <path d="M73 84V42H142V84" fill={shade} /><path d="M78 47H137M78 53H137" />
    <path d="M84 34H121L131 44V87H84ZM121 34V44H131" fill={paper} />
    <svg x="75" y="19" width="66" height="68" viewBox="0 0 66 68" overflow="hidden">
      <g data-art="paper-feed" style={{ transform:"translateY(75px)" }}>
        <path d="M7 4H49L59 14V68H7Z" fill={paper} /><path d="M49 4V14H59" />
        <path data-art="printed-lines" d="M17 27H46M17 35H46M17 43H37" pathLength="1" />
      </g>
    </svg>
    <path d="M46 99V92L56 82H181L198 99H215V161L207 169H46Z" fill={shade} />
    <rect x="27" y="147" width="252" height="25" rx="12.5" fill={shade} /><DriveWheel x={42} y={159.5} name="mail-drive-left" /><DriveWheel x={264} y={159.5} name="mail-drive-right" />
    <path d="M57 153H250M57 166H250" />
    <svg x="96" y="115" width="184" height="32" viewBox="96 115 184 32" overflow="hidden"><g data-art="mail" style={{ transform:"translate(232px, 119px)" }}>
      <rect width="43" height="27" rx="2" fill={accent} />
      <g data-art="envelope-lines"><path d="M1 2L21.5 17L42 2M1 26L15 13M42 26L28 13" /></g>
    </g></svg>
    <path d="M46 104Q46 93 57 93H174L190 108H207V158Q207 164 201 164H52Q46 164 46 158ZM96 115V147H207V115Z" fill={paper} fillRule="evenodd" />
    <path d="M96 115H207M96 147H207" /><rect x="87" y="84" width="70" height="8" rx="3" fill={paper} /><path d="M94 87H150" />
    <path d="M56 107H77M56 113H70" /><g transform="translate(68 142)"><Pivot radius={10} /><path d="M-5-3L5 3" /></g>
    <g transform="translate(145 115)"><g data-art="fold-arm" style={{ transform:"rotate(-48deg)" }}>
      <path d="M-3 0H3V6H-3Z" fill={shade} /><path d="M-23 6H23V13H-23Z" fill={paper} /><path d="M-17 10H17" />
    </g><Pivot radius={4} /></g>
    <g data-art="print-carriage"><rect x="85" y="74" width="20" height="8" rx="2" fill={paper} /><path d="M89 78H101" /><circle cx="94" cy="80" r="1.4" fill={accent} stroke="none" /></g>
    <circle data-art="mail-indicator" cx="183" cy="155" r="2.5" fill={accent} />
    <path d="M54 99H58M197 155H201" />
  </>;
}

/** Probe -> physical meter -> printed trace. This measures water; it does not filter it. */
function WaterAnalyzer() {
  return <>
    <path d="M18 185H282" />
    <path d="M26 184L32 176H267L276 184Z" fill={shade} />
    <path d="M119 176V45Q119 36 110 36H74V48H111V176Z" fill={shade} />
    <path d="M111 176V49Q111 44 105 44H70V53H103V176" fill={paper} /><path d="M106 172H118" />
    <rect x="63" y="53" width="26" height="22" rx="4" fill={paper} /><path d="M68 58H83M68 64H79" />
    <path d="M89 63H133Q144 63 144 76V99Q144 108 158 108" /><circle cx="158" cy="108" r="3" fill={shade} />
    <path d="M43 176H109M45 104H49V170Q49 174 53 174H99Q103 174 103 170V104H107" fill={paper} />
    <path d="M50 139Q63 134 76 139T102 139V169Q102 173 98 173H54Q50 173 50 169Z" fill={shade} stroke="none" /><path d="M50 139Q63 134 76 139T102 139M55 149H61M55 157H61M55 165H61" />
    <rect data-art="probe-shaft" x="75.2" y="74" width="1.6" height="26" fill="currentColor" stroke="none" />
    <g data-art="probe" style={{ transform:"translateY(26px)" }}><path d="M73 74H79V122Q79 127 76 127T73 122Z" fill={paper} /><path d="M73 119H79" /></g>
    <path d="M158 73L166 65H269L278 74V151L270 159H158Z" fill={shade} />
    <rect x="158" y="73" width="112" height="86" rx="7" fill={paper} />
    <circle cx="199" cy="104" r="23" fill="white" /><path d="M181 109L185 108M183 93L187 95M199 85V90M215 93L211 96M218 109L214 108" />
    <g transform="translate(199 104)"><g data-art="meter-needle" style={{ transform:"rotate(16deg)" }}><path d="M-5 6L10-13" /></g><circle r="3" fill={accent} /></g>
    <path d="M239 91H257M239 97H251" /><g transform="translate(248 119)"><Pivot radius={7} /><path d="M0-4V0" /></g>
    <path d="M166 159V176H175V159M252 159V176H261V159" fill={shade} />
    <rect x="182" y="137" width="64" height="5" rx="2" fill="currentColor" />
    <svg x="184" y="140" width="60" height="41" viewBox="0 0 60 41" overflow="hidden">
      <g data-art="record"><path d="M0 0H60V38L54 36L48 39L42 36L36 39L30 36L24 39L18 36L12 39L6 36L0 38Z" fill="white" /><path d="M8 8V29H52" strokeOpacity=".3" /><path d="M9 24L16 21L22 24L30 14L36 18L44 11L51 13" stroke={accent} /></g>
    </svg>
    <circle data-art="measurement-indicator" cx="259" cy="149" r="2" fill={accent} />
  </>;
}

/** A compact assembly jig, driver and electronic enclosure: one prototype, not a trophy. */
function PrototypeBench() {
  return <>
    <path d="M18 185H282" />
    <path d="M35 170V183H48V170M252 170V183H265V170M48 179H252" fill={shade} />
    <path d="M32 159L39 152H267L275 159V171H32Z" fill={shade} /><rect x="26" y="159" width="254" height="10" rx="2" fill={paper} /><path d="M40 164H83" />
    <path d="M52 158V69Q52 55 66 55H146L159 65V81H143V72H75V158Z" fill={shade} />
    <path d="M46 159V78Q46 63 61 63H142V76H68V159Z" fill={paper} /><path d="M42 159H74M55 90V130" />
    <circle cx="59" cy="76" r="3" fill={paper} /><path d="M59 74V78" />
    <rect x="138" y="67" width="32" height="16" rx="4" fill={paper} /><path d="M144 72H164" /><rect x="146" y="76" width="18" height="6" rx="1" fill={accent} />
    <rect data-art="driver-guide-left" x="149.2" y="83" width="1.6" height="0" fill="currentColor" stroke="none" /><rect data-art="driver-guide-right" x="159.2" y="83" width="1.6" height="0" fill="currentColor" stroke="none" />
    <g data-art="driver" style={{ transform:"translateY(-22px)" }}><rect x="144" y="99" width="22" height="15" rx="3" fill={paper} /><path d="M150 105H160M151 114V122H159V114M153 122V127L155 130L157 127V122" /></g>
    <path d="M107 154H237V159H107Z" fill={shade} />
    <g data-art="prototype"><path d="M120 136L126 131H220L226 136V151H120Z" fill={shade} /><rect x="120" y="136" width="106" height="17" rx="3" fill={paper} /><path d="M132 143H146M132 147H141" /><circle data-art="prototype-indicator" cx="211" cy="144" r="2.5" fill={accent} /></g>
    <g data-art="circuit-board"><path d="M130 126H213V133H130Z" fill={shade} /><path d="M130 126L135 122H218L213 126Z" fill={accent} /><path d="M170 124H185M137 133V136M147 133V136M197 133V136M207 133V136" /></g>
    <g data-art="jig-left"><path d="M113 154V130H129V136H123V154Z" fill={paper} /><path d="M117 145H121" /></g>
    <g data-art="jig-right"><path d="M214 154V130H222V148H229V154Z" fill={paper} /><path d="M216 145H220" /></g>
    <path data-art="fastener" d="M152 122H158V125H152ZM155 122V125" fill={paper} />
  </>;
}

const scenes = { "financial-systems":InspectionTunnel, "merchant-connection":DockingArm, "outbound-system":Letterpress, "water-measurement":WaterAnalyzer, "prototype-building":PrototypeBench };
export function PurposefulMachine({ scene }: { scene: IllustrationId }) {
  const Scene = scenes[scene];
  return <svg className="achievement-svg" viewBox="0 0 300 200" fill="none" aria-hidden="true" focusable="false"><g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><Scene /></g></svg>;
}
