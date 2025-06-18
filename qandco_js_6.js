StyleExtract = {
    getCssRulesFromDocumentStyleSheets: function(media, documentEl) {
        var resultCssRules = '';
        for (var i = 0; i < documentEl.styleSheets.length; i++)
        {
            var styleSheet = documentEl.styleSheets[i];

            if (this.isRuleFromMedia(styleSheet, media))
                resultCssRules += this.getCssRulesFromRuleList(styleSheet.cssRules || styleSheet.rules, media);
        }
        return resultCssRules;
    },
    getCssRulesFromRuleList: function(rules, media) {
        var resultCssRules = '';
        for (var i = 0; i < rules.length; i++)
        {
            var rule = rules[i];
            if (rule.type == 1) { // CSSStyleRule
                resultCssRules += rule.cssText + "\r\n";
            }
            else if (rule.type == 3) {// CSSImportRule
                if (this.isRuleFromMedia(rule, media))
                    resultCssRules += this.getCssRulesFromRuleList(rule.styleSheet.cssRules || rule.styleSheet.rules, media);
            }
            else if (rule.type == 4) { // CSSMediaRule
                if (this.isRuleFromMedia(rule, media))
                    resultCssRules += this.getCssRulesFromRuleList(rule.cssRules || rule.rules, media);
            }
        }
        return resultCssRules;
    }, 
    isRuleFromMedia: function(ruleOrStyleSheet, media) {
        while (ruleOrStyleSheet) {
            var mediaList = ruleOrStyleSheet.media;
            if (mediaList){
                if (!this.isMediaListContainsValue(mediaList, media) && !this.isMediaListContainsValue(mediaList, 'all') && mediaList.length > 0)
                    return false;
            }
            ruleOrStyleSheet = ruleOrStyleSheet.ownerRule || ruleOrStyleSheet.parentRule || ruleOrStyleSheet.parentStyleSheet;
        }
        return true;
    },
    isMediaListContainsValue: function(mediaList, media) {
        media = String(media).toLowerCase();

        for (var i = 0; i < mediaList.length; i++) {
            // Access to mediaList by "[index]" notation now work in IE (tested in versions 7, 8, 9)
            if (String(mediaList.item(i)).toLowerCase() == media)
                return true;
        }

        return false;
    }
}
FEHomepage = {
    sectionSelector: '#sections > section:first-of-type',
    Init: function() {
        // Extract css from fluid-engine section
        const styleElement = $(`${this.sectionSelector} [data-fluid-engine] style`);
        // Create an iframe and append the styleElement to it
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        iframe.contentDocument.body.appendChild(styleElement.clone()[0]);
        // Acess the document.styleSheets of the iframe
        const styleRule = StyleExtract.getCssRulesFromDocumentStyleSheets('(min-width: 768px)', iframe.contentDocument)
        // After extracting the css rules, append it to the current document to overrule the mobile
        $(`${this.sectionSelector} [data-fluid-engine]`).append(`<style> @media (max-width: 768px) { ${styleRule} } </style>`);

        // Exclude logo
        const logo = $(`${this.sectionSelector} .fluid-engine [data-image$="Fixed-logo"]`);

        if ( logo.length ) {
            const imageBlockLogo = logo.closest('.fe-block');
            // imageBlockLogo.classList.add("scrolly-exclude", "bs-home__logo");
            // Add the new logo holder into the section
            $(`${this.sectionSelector}`).append(`<div class="bs-home__logo-holder"><img src="${ logo[0].getAttribute("data-src") }"/></div>`);
            imageBlockLogo.remove();
        }

        const preAnimElements = document.querySelectorAll('.fluid-image-animation-wrapper');
        preAnimElements.forEach(element => {
            element.className = element.className.replace(/\bpre\w+\b/g, '');
        });

        this.Clone(),
        this.ItemTransition(),
        this.LoadMore()
    },
    Clone: function() {
        $(`${this.sectionSelector}`).append("<div id='bs-fe-blocks-cloned' style='display: none;'></div>");
        $(`${this.sectionSelector} .fluid-engine`).clone().appendTo("#bs-fe-blocks-cloned");
    },

    ItemTransition: function() {
    gsap.utils.toArray(`${this.sectionSelector} [data-fluid-engine] > .fluid-engine:last-of-type .fe-block .sqs-block-image:not(.scrolly-exclude)`).forEach(function(e) {
        const animation = gsap.timeline({
            scrollTrigger: {
                trigger: e,
                pin: !1,
                scrub: true,
                start: "top 99%", // changed from "top 70%"
                end: "bottom top"
            }
        });
        const mediaContainer = e.querySelector(".sqs-block-alignment-wrapper");
        const media = e.querySelector("img[data-src]");
        animation.to(media, {
            duration: 1,
            opacity: 1
        }, 0);
        animation.to(mediaContainer, {
            duration: 1,
            scale: 1.3 // changed from 1
        }, "-=2");
        animation.to(media, {
            duration: 1,
            opacity: 0
        }, "+=1");

            try {
                // Get image dimension
                const dimensions = media.dataset.imageDimensions.split("x");
                let ratio = dimensions[0] / dimensions[1];
                ratio = ratio > 1 ? 1 / ratio : ratio;
                media.dataset.mediaRatio = ratio;
            } catch (error) {
                console.log(error);
            }
        })
    },
    LoadMore: function() {
        ScrollTrigger.create({
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            onUpdate: ( e ) => {
                const scrollThreshold = 0.8; // The threshold at which to trigger the action
                const isScrollingDown = e.direction === 1; // Check if scrolling down
                const progress = e.progress.toFixed(2); // Get the current progress, rounded to 2 decimal places

                // If the scroll progress is greater than or equal to the threshold and scrolling down, perform these actions:
                if (progress >= scrollThreshold && isScrollingDown) {
                    // Clone the fluid engine element and append it to the target element
                    const clonedFluidEngine = $("#bs-fe-blocks-cloned > .fluid-engine").clone();
                    $(`${this.sectionSelector} [data-fluid-engine]`).append(clonedFluidEngine);
                    
                    // Reinit layout Squarespace
                    Squarespace.initializeLayoutBlocks(Y, Y.one(clonedFluidEngine[0]));
                    // Re run Squarespace Image Loader
                    new Y.Squarespace.Loader({
                        img: Y.all(`${this.sectionSelector} [data-fluid-engine] img[data-image]`)
                    });

                    // Run the item transition animation on the newly added element
                    FEHomepage.ItemTransition();

                    // Refresh the scroll trigger
                    ScrollTrigger.refresh();
                }
            }
        })
    }
};

// Create a IIFE function to load the script
(function() {
    if (window.self !== window.top) {
        return;
    }
    loadjs(['https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js'], 'jquery');
    loadjs(['https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=default%2CArray.prototype.find%2CIntersectionObserver',
            'https://cdn.jsdelivr.net/npm/gsap@3.4.0/dist/gsap.min.js',
            'https://cdn.jsdelivr.net/npm/gsap@3.4.0/dist/ScrollTrigger.min.js'], 'bundle', {
        before: function(path, scriptEl) { /* execute code before fetch */ },
        async: true,  // load files synchronously or asynchronously (default: true)
        numRetries: 3,  // see caveats about using numRetries with async:false (default: 0),
        returnPromise: false  // return Promise object (default: false)
    });

    loadjs.ready(['jquery', 'bundle'], {
        success: function() {
            gsap.registerPlugin(ScrollTrigger);
            $(document).scrollTop(0);
            // Instead of lean on barba, we use the Homepage init directly
            setTimeout(function() {
                FEHomepage.Init()
            }, 100);
        },
        error: function(depsNotFound) { 
            /* myBundle or jquery failed to load */ 
        }
    });

    // Listen to window.load event
    window.addEventListener('load', function() {
        document.querySelector('.bs--screen-overlay').classList.add("exit");
    });
})();
