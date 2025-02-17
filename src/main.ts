import { Application, Assets, BlurFilter, Container, Graphics, Sprite, Texture } from "pixi.js";

(async () =>
{
    // Create a new application
    const app = new Application();
    let symbolId;
    // Initialize the application
    await app.init({ background: "#000", resizeTo: window });

    // Append the application canvas to the document body
    document.getElementById("pixi-container")!.appendChild(app.canvas);
    await Assets.load([
        "/assets/9.png",
        "/assets/10.png",
        "/assets/J.png",
        "/assets/Q.png",
        "/assets/K.png",
        "/assets/M1.png",
        "/assets/M2.png",
        "/assets/M3.png",
        "/assets/M4.png",
        "/assets/M5.png",
        "/assets/M6.png",
        "/assets/BONUS.png",
        "/assets/Spin.png",
        "/assets/BG.jpg",
        "/assets/reel.png",
        "/assets/shadow.png",
    ])

    const slotTextures = [
        Object.assign(Texture.from('/assets/10.png'), { name: "symbol0" }),
        Object.assign(Texture.from('/assets/J.png'), { name: "symbol1" }),
        Object.assign(Texture.from('/assets/Q.png'), { name: "symbol2" }),
        Object.assign(Texture.from('/assets/K.png'), { name: "symbol3" }),
        Object.assign(Texture.from('/assets/M1.png'), { name: "symbol4" }),
        Object.assign(Texture.from('/assets/M2.png'), { name: "symbol5" }),
        Object.assign(Texture.from('/assets/M3.png'), { name: "symbol6" }),
        Object.assign(Texture.from('/assets/M4.png'), { name: "symbol7" }),
        Object.assign(Texture.from('/assets/M5.png'), { name: "symbol8" }),
        Object.assign(Texture.from('/assets/M6.png'), { name: "symbol9" }),
        Object.assign(Texture.from('/assets/BONUS.png'), { name: "symbol10" }),
    ];


    const bgTexture = await Assets.load("/assets/BG.jpg");
    const reelTexture = await Assets.load("/assets/reel.png");
    const bg = new Sprite(bgTexture);

    const reelFrame = new Sprite(reelTexture);
    app.stage.addChild(bg);

    bg.scale.set(0.55);

    const REEL_WIDTH = 149;
    const SYMBOL_SIZE = 150;

    const reels: any[] = [];
    const reelContainer = new Container();


    for (let i = 0; i < 5; i++)
    {
        const rc = new Container();

        rc.x = i * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel = {
            container: rc,
            symbols: [] as Sprite[],
            position: 0,
            previousPosition: 0,
            blur: new BlurFilter(),
        };

        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [ reel.blur ];

        // Build the symbols
        for (let j = 0; j < 4; j++)
        {
            symbolId = slotTextures[ Math.floor(Math.random() * slotTextures.length) ]
            const symbol = new Sprite(symbolId);
            symbol.y = j * SYMBOL_SIZE;
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
            reel.symbols.push(symbol);
            rc.addChild(symbol);
        }
        reels.push(reel);
    }

    app.stage.addChild(reelContainer);
    reelContainer.y = (app.screen.height - SYMBOL_SIZE * 3) / 2;
    reelContainer.x = 160;

    app.stage.addChild(reelFrame);
    reelFrame.scale.set(0.35);
    reelFrame.position.set(50, 100);

    const reelMask = new Graphics();
    app.stage.addChild(reelMask);

    reelMask.rect(0, 0, 850, 450);
    reelMask.fill(0xFFFFFF);
    reelMask.position.set(150, 130);
    reelContainer.mask = reelMask;


    const spinTexture = await Assets.load("/assets/Spin.png");
    const spin = new Sprite(spinTexture);
    app.stage.addChild(spin);
    spin.scale.set(1.5);
    spin.position.set(900, 300);
    spin.eventMode = 'static';
    spin.cursor = 'pointer';

    spin.addListener('pointerdown', () =>
    {
        startPlay();
    });

    let running = false;

    function startPlay()
    {
        if (running) return;
        running = true;

        for (let i = 0; i < reels.length; i++)
        {
            const r = reels[ i ];
            const extra = Math.floor(Math.random() * 3);
            const target = r.position + 10 + i * 5 + extra;
            const time = 2500 + i * 600 + extra * 600;

            tweenTo(r, 'position', target, time, backout(0.5), null, i === reels.length - 1 ? reelsComplete : null);
        }
    }

    function reelsComplete()
    {
        running = false;
    }

    app.ticker.add(() =>
    {
        for (let i = 0; i < reels.length; i++)
        {
            const r = reels[ i ];
            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

            for (let j = 0; j < r.symbols.length; j++)
            {
                const s = r.symbols[ j ];
                const prevy = s.y;

                s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                if (s.y < 0 && prevy > SYMBOL_SIZE)
                {
                    s.texture = slotTextures[ Math.floor(Math.random() * slotTextures.length) ];
                    s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                    s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                }
            }
        }
    });

    const tweening: any[] = [];

    function tweenTo(object: { [ x: string ]: any; }, property: string, target: any, time: number, easing: (t: any) => number, onchange: null, oncomplete: (() => void) | null)
    {
        const tween = {
            object,
            property,
            propertyBeginValue: object[ property ],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            start: Date.now(),
        };

        tweening.push(tween);
        return tween;
    }

    app.ticker.add(() =>
    {
        const now = Date.now();
        const remove = [];

        for (let i = 0; i < tweening.length; i++)
        {
            const t = tweening[ i ];
            const phase = Math.min(1, (now - t.start) / t.time);

            t.object[ t.property ] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
            if (t.change) t.change(t);
            if (phase === 1)
            {
                t.object[ t.property ] = t.target;
                if (t.complete) t.complete(t);
                remove.push(t);
                console.log("-------------")
                for (let j = 0; j < t.object.symbols.length; j++) {
                    console.log(t.object.symbols[j].texture.name);
                }

            }
        }
        for (let i = 0; i < remove.length; i++)
        {
            tweening.splice(tweening.indexOf(remove[ i ]), 1);
        }
    });

    function lerp(a1: number, a2: number, t: number)
    {
        return a1 * (1 - t) + a2 * t;
    }

    function backout(amount: number)
    {
        return (t: number) => --t * t * ((amount + 1) * t + amount) + 1;
    }
})();
