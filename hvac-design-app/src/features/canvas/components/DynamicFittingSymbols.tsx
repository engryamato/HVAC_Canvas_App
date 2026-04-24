import type { CSSProperties, ReactNode } from 'react';
import type {
  DynamicBranchFittingProps,
  DynamicFittingCommonProps,
  DynamicFittingSymbolSpec,
  DynamicPairedSizeFittingProps,
  DynamicRectToRoundFittingProps,
  DynamicSingleSizeFittingProps,
} from '../renderers/fittingSymbolModel';
import { normalizeSize } from '../renderers/fittingSymbolModel';

const DEFAULT_STROKE = 'currentColor';
const DEFAULT_FILL = 'none';
const VIEWBOX_W = 120;
const VIEWBOX_H = 80;
const CENTER_Y = VIEWBOX_H / 2;

function labelStyle(): CSSProperties {
  return {
    fontSize: 7,
    fill: 'currentColor',
    fontFamily: 'Arial, sans-serif',
  };
}

function SvgShell({
  width = 140,
  height = 90,
  className,
  children,
}: {
  width?: number;
  height?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      className={className}
      role="img"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function commonSvgProps(props: DynamicFittingCommonProps) {
  return {
    stroke: props.stroke ?? DEFAULT_STROKE,
    strokeWidth: props.strokeWidth ?? 2,
    fill: props.fill ?? DEFAULT_FILL,
  };
}

export function Elbow90FittingSymbol(props: DynamicSingleSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const duct = normalizeSize(props.size, props.size);
  const outerR = 40;
  const innerR = Math.max(outerR - duct, 10);
  const cx = 42;
  const cy = 54;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <path
        d={[
          `M ${cx} ${cy - outerR}`,
          `A ${outerR} ${outerR} 0 0 1 ${cx + outerR} ${cy}`,
          `L ${cx + innerR} ${cy}`,
          `A ${innerR} ${innerR} 0 0 0 ${cx} ${cy - innerR}`,
          'Z',
        ].join(' ')}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      <line x1={cx} y1={cy - outerR} x2={cx} y2={cy - innerR} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx + innerR} y1={cy} x2={cx + outerR} y2={cy} stroke={stroke} strokeWidth={strokeWidth} />
      {props.showLabels ? (
        <text x={60} y={12} textAnchor="middle" style={labelStyle()}>
          {props.label}
        </text>
      ) : null}
    </SvgShell>
  );
}

export function Elbow45FittingSymbol(props: DynamicSingleSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const duct = normalizeSize(props.size, props.size, 10, 28);
  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <path
        d={[
          `M 18 ${CENTER_Y + duct / 2}`,
          `L 44 ${CENTER_Y + duct / 2}`,
          `L 84 ${CENTER_Y - 26 + duct / 2}`,
          `L 84 ${CENTER_Y - 26 - duct / 2}`,
          `L 44 ${CENTER_Y - duct / 2}`,
          `L 18 ${CENTER_Y - duct / 2}`,
          'Z',
        ].join(' ')}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {props.showLabels ? (
        <text x={60} y={12} textAnchor="middle" style={labelStyle()}>
          {props.label}
        </text>
      ) : null}
    </SvgShell>
  );
}

export function ElbowMiteredFittingSymbol(props: DynamicSingleSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const duct = normalizeSize(props.size, props.size, 10, 28);
  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <path
        d={[
          `M 18 ${CENTER_Y + duct / 2}`,
          `L 42 ${CENTER_Y + duct / 2}`,
          `L 60 ${CENTER_Y + duct / 2}`,
          `L 60 ${CENTER_Y - 2}`,
          `L 84 ${CENTER_Y - 2}`,
          `L 84 ${CENTER_Y - 26 - duct / 2}`,
          `L 60 ${CENTER_Y - 26 - duct / 2}`,
          `L 42 ${CENTER_Y - duct / 2}`,
          `L 18 ${CENTER_Y - duct / 2}`,
          'Z',
        ].join(' ')}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {props.showLabels ? (
        <text x={60} y={12} textAnchor="middle" style={labelStyle()}>
          {props.label}
        </text>
      ) : null}
    </SvgShell>
  );
}

export function ReducerFittingSymbol(props: DynamicPairedSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const maxSize = Math.max(props.inletSize, props.outletSize);
  const leftH = normalizeSize(props.inletSize, maxSize);
  const rightH = normalizeSize(props.outletSize, maxSize);
  const leftTop = CENTER_Y - leftH / 2;
  const leftBottom = CENTER_Y + leftH / 2;
  const rightTop = CENTER_Y - rightH / 2;
  const rightBottom = CENTER_Y + rightH / 2;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <path
        d={`M 12 ${leftTop} L 108 ${rightTop} L 108 ${rightBottom} L 12 ${leftBottom} Z`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {props.showLabels ? (
        <>
          <text x={18} y={12} textAnchor="start" style={labelStyle()}>
            {props.inletLabel}
          </text>
          <text x={102} y={12} textAnchor="end" style={labelStyle()}>
            {props.outletLabel}
          </text>
        </>
      ) : null}
    </SvgShell>
  );
}

export function TeeFittingSymbol(props: DynamicBranchFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const maxSize = Math.max(props.mainSize, props.branchSize);
  const mainH = normalizeSize(props.mainSize, maxSize);
  const branchW = normalizeSize(props.branchSize, maxSize, 10, 32);
  const branchH = normalizeSize(props.branchSize, maxSize, 10, 32);
  const mainTop = CENTER_Y - mainH / 2;
  const branchX = 52;
  const branchY = mainTop - branchH;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <rect x={12} y={mainTop} width={96} height={mainH} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      <rect x={branchX} y={branchY} width={branchW} height={branchH} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      {props.showLabels ? (
        <>
          <text x={18} y={12} textAnchor="start" style={labelStyle()}>
            {props.mainLabel}
          </text>
          <text x={102} y={12} textAnchor="end" style={labelStyle()}>
            {props.branchLabel}
          </text>
        </>
      ) : null}
    </SvgShell>
  );
}

export function WyeFittingSymbol(props: DynamicBranchFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const maxSize = Math.max(props.mainSize, props.branchSize);
  const mainH = normalizeSize(props.mainSize, maxSize);
  const branchH = normalizeSize(props.branchSize, maxSize, 10, 24);
  const mainTop = CENTER_Y - mainH / 2;
  const branchBaseY = mainTop + mainH / 2;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <rect x={12} y={mainTop} width={96} height={mainH} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      <path
        d={`M 56 ${branchBaseY - branchH / 2} L 82 ${branchBaseY - branchH / 2 - 22} L 96 ${branchBaseY - branchH / 2 - 22} L 70 ${branchBaseY - branchH / 2} Z`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      <path
        d={`M 56 ${branchBaseY + branchH / 2} L 70 ${branchBaseY + branchH / 2} L 96 ${branchBaseY + branchH / 2 - 22} L 82 ${branchBaseY + branchH / 2 - 22} Z`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {props.showLabels ? (
        <>
          <text x={18} y={12} textAnchor="start" style={labelStyle()}>
            {props.mainLabel}
          </text>
          <text x={102} y={12} textAnchor="end" style={labelStyle()}>
            {props.branchLabel}
          </text>
        </>
      ) : null}
    </SvgShell>
  );
}

export function EndCapFittingSymbol(props: DynamicSingleSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const duct = normalizeSize(props.size, props.size);
  const top = CENTER_Y - duct / 2;
  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <rect x={12} y={top} width={74} height={duct} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      <line x1={86} y1={top} x2={86} y2={top + duct} stroke={stroke} strokeWidth={(props.strokeWidth ?? 2) + 1} />
      {props.showLabels ? (
        <text x={60} y={12} textAnchor="middle" style={labelStyle()}>
          {props.label}
        </text>
      ) : null}
    </SvgShell>
  );
}

export function RectToRoundFittingSymbol(props: DynamicRectToRoundFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const maxSize = Math.max(props.rectWidth, props.rectHeight, props.roundSize);
  const rectH = normalizeSize(props.rectHeight, maxSize, 10, 34);
  const rectW = normalizeSize(props.rectWidth, maxSize, 16, 42);
  const roundD = normalizeSize(props.roundSize, maxSize, 12, 30);
  const rectX = 12;
  const rectY = CENTER_Y - rectH / 2;
  const circleCx = 92;
  const circleCy = CENTER_Y;
  const circleR = roundD / 2;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <rect x={rectX} y={rectY} width={rectW} height={rectH} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      <path
        d={`M ${rectX + rectW} ${rectY} Q 66 ${rectY} ${circleCx - circleR} ${circleCy - circleR}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <path
        d={`M ${rectX + rectW} ${rectY + rectH} Q 66 ${rectY + rectH} ${circleCx - circleR} ${circleCy + circleR}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle cx={circleCx} cy={circleCy} r={circleR} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      {props.showLabels ? (
        <>
          <text x={18} y={12} textAnchor="start" style={labelStyle()}>
            {props.rectLabel}
          </text>
          <text x={102} y={12} textAnchor="end" style={labelStyle()}>
            {props.roundLabel}
          </text>
        </>
      ) : null}
    </SvgShell>
  );
}

export function OffsetFittingSymbol(props: DynamicSingleSizeFittingProps) {
  const { stroke, strokeWidth, fill } = commonSvgProps(props);
  const duct = normalizeSize(props.size, props.size);
  const top1 = CENTER_Y - duct / 2 + 10;
  const top2 = CENTER_Y - duct / 2 - 10;

  return (
    <SvgShell width={props.width} height={props.height} className={props.className}>
      <path
        d={[
          `M 12 ${top1}`,
          `L 42 ${top1}`,
          `L 74 ${top2}`,
          `L 108 ${top2}`,
          `L 108 ${top2 + duct}`,
          `L 74 ${top2 + duct}`,
          `L 42 ${top1 + duct}`,
          `L 12 ${top1 + duct}`,
          'Z',
        ].join(' ')}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {props.showLabels ? (
        <text x={60} y={12} textAnchor="middle" style={labelStyle()}>
          {props.label}
        </text>
      ) : null}
    </SvgShell>
  );
}

export function DynamicFittingSymbol({ spec }: { spec: DynamicFittingSymbolSpec }) {
  switch (spec.kind) {
    case 'elbow_90':
      return <Elbow90FittingSymbol {...spec.props} />;
    case 'elbow_45':
      return <Elbow45FittingSymbol {...spec.props} />;
    case 'elbow_mitered':
      return <ElbowMiteredFittingSymbol {...spec.props} />;
    case 'reducer':
      return <ReducerFittingSymbol {...spec.props} />;
    case 'tee':
      return <TeeFittingSymbol {...spec.props} />;
    case 'wye':
      return <WyeFittingSymbol {...spec.props} />;
    case 'end_cap':
      return <EndCapFittingSymbol {...spec.props} />;
    case 'rect_to_round':
      return <RectToRoundFittingSymbol {...spec.props} />;
    case 'offset':
      return <OffsetFittingSymbol {...spec.props} />;
    default:
      return null;
  }
}
