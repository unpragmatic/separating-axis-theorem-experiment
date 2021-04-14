
interface Point {
    x: number
    y: number
}

interface RenderProps {
    fillStyle: string
}

interface Rect {
    type: 'rect'
    p0: Point
    p1: Point
    p2: Point
    p3: Point
    renderProps: RenderProps
}

type PhysicsBody = Rect

const defaultRenderProps = {
    fillStyle: 'rgb(200, 200, 200)'
}


function PointDiff(a: Point, b: Point): Point {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

function PointDistance(a: Point, b: Point): number {
    const diff = PointDiff(a, b);
    return Math.sqrt(diff.x * diff.x + diff.y * diff.y);
}

function Normalise(a: Point): void {
    const length = Math.sqrt(a.x * a.x + a.y * a.y);
    a.x /= length;
    a.y /= length;
}

function RectNormals(rect: Rect): [Point, Point, Point, Point] {
    const d0 = PointDiff(rect.p1, rect.p0);
    const n0 = { x: d0.y, y: -d0.x }

    const d1 = PointDiff(rect.p2, rect.p1);
    const n1 = { x: d1.y, y: -d1.x }

    const d2 = PointDiff(rect.p3, rect.p2);
    const n2 = { x: d2.y, y: -d2.x }

    const d3 = PointDiff(rect.p0, rect.p3);
    const n3 = { x: d3.y, y: -d3.x }

    Normalise(n0);
    Normalise(n1);
    Normalise(n2);
    Normalise(n3);

    return [n0, n1, n2, n3];
}

function RectRotate(rect: Rect, radians: number) {
    const center: Point = {
        x: (rect.p0.x + rect.p1.x + rect.p2.x + rect.p3.x) / 4,
        y: (rect.p0.y + rect.p1.y + rect.p2.y + rect.p3.y) / 4
    }

    RectTranslate(rect, { x: - center.x, y: - center.y })
    {
        let { x: oldX, y: oldY } = rect.p0;
        rect.p0.x = oldX * Math.sin(radians) - oldY * Math.cos(radians);
        rect.p0.y = oldX * Math.cos(radians) + oldY * Math.sin(radians);
    }
    {
        let { x: oldX, y: oldY } = rect.p1;
        rect.p1.x = oldX * Math.sin(radians) - oldY * Math.cos(radians);
        rect.p1.y = oldX * Math.cos(radians) + oldY * Math.sin(radians);
    }
    {
        let { x: oldX, y: oldY } = rect.p2;
        rect.p2.x = oldX * Math.sin(radians) - oldY * Math.cos(radians);
        rect.p2.y = oldX * Math.cos(radians) + oldY * Math.sin(radians);
    }
    {
        let { x: oldX, y: oldY } = rect.p3;
        rect.p3.x = oldX * Math.sin(radians) - oldY * Math.cos(radians);
        rect.p3.y = oldX * Math.cos(radians) + oldY * Math.sin(radians);
    }

    RectTranslate(rect, { x: center.x, y: center.y })
}

function RectTranslate(rect: Rect, vec: Point) {
    rect.p0.x += vec.x;
    rect.p0.y += vec.y;

    rect.p1.x += vec.x;
    rect.p1.y += vec.y;

    rect.p2.x += vec.x;
    rect.p2.y += vec.y;

    rect.p3.x += vec.x;
    rect.p3.y += vec.y;
}

function RectFrom(x, y, width, height, renderProps?: RenderProps): Rect {
    return {
        type: 'rect',
        p0: { x, y },
        p1: { x: x + width, y },
        p2: { x: x + width, y: y + height },
        p3: { x, y: y + height },
        renderProps: renderProps ?? defaultRenderProps
    }
}

interface State {
    bodies: PhysicsBody[]
}

const state = {
    bodies: [
        RectFrom(10, 10, 100, 100),
        RectFrom(200, 200, 100, 100),
    ]
}

// @ts-ignore
window.state = state;


function init() {
    console.log("Init")

    const canvas = document.getElementById('main') as HTMLCanvasElement;
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    const context = canvas.getContext('2d')

    canvas.addEventListener('click', (event) => {
        RectTranslate(state.bodies[0], {
            x: event.offsetX - state.bodies[0].p0.x,
            y: event.offsetY - state.bodies[0].p0.y
        })
    })

        // RectRotate(state.bodies[1], 1);
    const mainLoop = () => {
        render(canvas, context, state, { debug: true });

        // console.log(state.bodies[1].p0.x)
        RectRotate(state.bodies[1], 0.01)
        if (collisionDetection(state, context)) {
            state.bodies[1].renderProps.fillStyle = 'rgb(255, 0, 0)';
        } else {
            state.bodies[1].renderProps.fillStyle = 'rgb(200, 200, 200)';
        }
        // RectTranslate(state.bodies[1], { x: 1, y: 0})

        requestAnimationFrame(mainLoop)
    }

    requestAnimationFrame(mainLoop);
}

function DotProduct(a: Point, b: Point) {
    return a.x * b.x + a.y * b.y;
}

function collisionDetection(state: State, ctx: CanvasRenderingContext2D) {
    const b0 = state.bodies[0];
    const b1 = state.bodies[1];
    let collision = true;
    for (const n of RectNormals(b0)) {

        let b0min = Number.POSITIVE_INFINITY;
        let b0max = Number.NEGATIVE_INFINITY;
        for (const p of [b0.p0, b0.p1, b0.p2, b0.p3]) {
            const value = DotProduct(n, p);
            b0min = Math.min(b0min, value);
            b0max = Math.max(b0max, value);
        }

        let b1min = Number.POSITIVE_INFINITY;
        let b1max = Number.NEGATIVE_INFINITY;

        for (const p of [b1.p0, b1.p1, b1.p2, b1.p3]) {
            const value = DotProduct(n, p);
            b1min = Math.min(b1min, value);
            b1max = Math.max(b1max, value);
        }

        ctx.beginPath();
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.moveTo(b0min * n.x, b0min * n.y);
        ctx.lineTo(b0max * n.x, b0max * n.y);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgb(0, 255, 0)';
        ctx.moveTo(b1min * n.x, b1min * n.y);
        ctx.lineTo(b1max * n.x, b1max * n.y);
        ctx.closePath();
        ctx.stroke();



        if ((b0min <= b1min && b1min <= b0max) || (b0min <= b1max && b1max <= b0max)
          ||(b1min <= b0min && b0min <= b1max) || (b1min <= b0max && b0max <= b1max)) {
            continue
        } else {
            collision = false;
        }
    }

    for (const n of RectNormals(b1)) {
        let b0min = Number.POSITIVE_INFINITY;
        let b0max = Number.NEGATIVE_INFINITY;
        for (const p of [b0.p0, b0.p1, b0.p2, b0.p3]) {
            const value = DotProduct(n, p);
            b0min = Math.min(b0min, value);
            b0max = Math.max(b0max, value);
        }

        let b1min = Number.POSITIVE_INFINITY;
        let b1max = Number.NEGATIVE_INFINITY;

        for (const p of [b1.p0, b1.p1, b1.p2, b1.p3]) {
            const value = DotProduct(n, p);
            b1min = Math.min(b1min, value);
            b1max = Math.max(b1max, value);
        }

        const origin = { x: 400, y: 400}
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.moveTo(origin.x + b0min * n.x / 10, origin.y + b0min * n.y / 10);
        ctx.lineTo(origin.x + b0max * n.x / 10, origin.y + b0max * n.y / 10);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgb(0, 255, 0)';
        ctx.moveTo(origin.x + b1min * n.x / 10, origin.y + b1min * n.y / 10);
        ctx.lineTo(origin.x + b1max * n.x / 10, origin.y + b1max * n.y / 10);
        ctx.closePath();
        ctx.stroke();

        if ((b0min <= b1min && b1min <= b0max) || (b0min <= b1max && b1max <= b0max)
          ||(b1min <= b0min && b0min <= b1max) || (b1min <= b0max && b0max <= b1max)) {
            continue
        } else {
            // console.log('No collision')
            collision = false;
        }
    }


    if (collision) {
        return true;
    } else {
        return false;
    }
}

interface RenderOptions {
    debug: boolean
}

function render(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, state: State, opts: RenderOptions) {
    context.fillStyle = 'rgb(255, 255, 255)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const body of state.bodies) {
        if (body.type === 'rect') {
            context.fillStyle = body.renderProps.fillStyle;
            context.beginPath();
            context.moveTo(body.p0.x, body.p0.y);
            context.lineTo(body.p1.x, body.p1.y)
            context.lineTo(body.p2.x, body.p2.y)
            context.lineTo(body.p3.x, body.p3.y)
            context.fill();

            if (opts.debug) {
                const [n0, n1, n2, n3] = RectNormals(body);
                for (const [n, p] of [[n0, body.p0], [n1, body.p1], [n2, body.p2], [n3, body.p3]]) {
                    context.beginPath();
                    context.moveTo(p.x, p.y);
                    context.lineTo(p.x + 100 * n.x, p.y + 100 * n.y);
                    context.closePath();
                    context.stroke();
                }
            }
        }
    }
}


console.log("Loading");

window.addEventListener('load', init);