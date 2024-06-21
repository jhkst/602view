// Description: DOM writer for 602text
class DOMWriter {

    constructor(parent) {
        parent.replaceChildren();
        this.allTagClass = 'c602';
        this.parent = parent;
        
        this.currentTag = parent;
        this.currentPageTag = null;
        this.charTable;
        this.currentClasses = [];
        this.tabs = '-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T-----T'
        this.marginTop = 3;
        this.marginBottom = 3;
        this.leftMargin = 1;
        this.rightMargin = 65;
        this.pageLength = 55;
        this.printLeftMargin = 5; // left margin for printout
        this.firstPageNumber = 1; // first page number
        this.lineHeight = 6;  // 6 == 1, 4 == 1.5, 3 == 2
        this.header = null;
        this.footer = null;
        this.printOmitPage = false;
        this.charsetMode = 0;

        this.pageLinesCounter = 0;
        this.charOnLineCounter = 0;

        this.readingHeader = true;
    }

    setCharTable(charTable) { this.charTable = charTable; }
    setTabs(tabs) { this.tabs = tabs; }
    setMarginTop(marginTop) { this.marginTop = marginTop; }
    setMarginBottom(marginBottom) { this.marginBottom = marginBottom; }
    setLeftMargin(leftMargin) { this.leftMargin = leftMargin;}
    setRightMargin(rightMargin) { this.rightMargin = rightMargin; }
    setPageLength(pageLength) { this.pageLength = pageLength; }
    setPrintLeftMargin(printLeftMargin) { this.printLeftMargin = printLeftMargin;}
    setFirstPageNumber(firstPageNumber) { this.firstPageNumber = firstPageNumber; }
    setLineHeight(lineHeight) { this.lineHeight = lineHeight; this.#updateLineSpacing(); }
    setPrintOmitPageNumber() { this.printOmitPage = true; }
    setHeader(header) { this.header = header; }
    setFooter(footer) { this.footer = footer; }
    setCharsetMode(charsetMode) { this.charsetMode = charsetMode; }


    newPage() {
        const pageClass = 'page'; 

        let copyStyles = null;
        if (this.currentTag.tagName === 'SPAN') {
            console.log('Page number', this.firstPageNumber);
            copyStyles = this.currentTag.className.split(' ').filter(c => c && c !== this.allTagClass);
            copyStyles.forEach(c => this.#switchStyleClass(c));
        }

        const pageTag = document.createElement('div');
        pageTag.setAttribute('title', 'Page ' + this.firstPageNumber++);
        pageTag.className = [this.allTagClass, pageClass].join(' ');
        this.parent.appendChild(pageTag);
        this.currentTag = pageTag;
        this.currentPageTag = pageTag;
        this.currentClasses = []; //???
        this.pageLinesCounter = 0;
        

        // top margin
        this.#marginLines(this.marginTop);

        if (copyStyles) {
            copyStyles.forEach(c => this.#switchStyleClass(c));
        }
    }

    #leftMarginSpaces() {
        // return ' '.repeat(this.leftMargin + this.printLeftMargin);
        return ' '.repeat(this.printLeftMargin);
    }

    switchFontStyle(fontStyle) {
        switch (fontStyle) {
            case FontStyle.BOLD: this.#switchStyleClass('bold'); break;
            case FontStyle.ITALIC: this.#switchStyleClass('italic'); break;
            case FontStyle.UNDERLINE: this.#switchStyleClass('underline'); break;
            case FontStyle.WIDE: this.#switchStyleClass('wideFont'); break;
            case FontStyle.HIGH: this.#switchStyleClass('highFont'); break;
            case FontStyle.UPPER_INDEX: this.#switchStyleClass('upperIndex'); break;
            case FontStyle.LOWER_INDEX: this.#switchStyleClass('lowerIndex'); break;
            case FontStyle.BIG: this.#switchStyleClass('bigFont'); break;
            default: console.warn('Unknown font style', fontStyle);
        }
    }

    #switchStyleClass(className) {
        if (this.currentTag.className.split(' ').includes(className)) {
            this.#adjustStyle(this.currentTag);
            this.currentTag = this.currentTag.parentElement;
        } else {
            let span = document.createElement('span');
            span.className = [this.allTagClass, this.currentClasses, className].join(' ');
            this.currentTag.appendChild(span);
            this.currentTag = span;
        }
    }

    #adjustStyle(tag) { // adjust width of span of wide and big font
        const w = tag.getBoundingClientRect().width;
        tag.style.width = w + 'px';
    }

    writeChar(utf8Char) {
        this.currentTag.appendChild(document.createTextNode(utf8Char));
        // if it's wide or big font add 2 spaces
        const classNames = this.currentTag.className.split(' ');
        if (classNames.includes('wideFont') || classNames.includes('bigFont')) {
            this.charOnLineCounter += 2;
        } else {
            this.charOnLineCounter++;
        }
    }

    writeTab() {
        throw new Error('Tab not implemented');
    }

    newLine(createPageOnOverflow = true) {
        if (this.readingHeader) {
            this.readingHeader = false;
            this.newPage();
        }

        // if we are in span, write the newline after it
        let tagToAppend = this.currentTag;

        if (this.currentTag.tagName === 'SPAN') {
            tagToAppend = this.currentTag.parentElement;
        } 
        tagToAppend.appendChild(document.createElement('br'));
        tagToAppend.appendChild(document.createTextNode(this.#leftMarginSpaces()));
        // prepend left margin to new line
        
        this.pageLinesCounter += this.#lineSpacing();
        if (this.#isOnNewPage() && createPageOnOverflow) {
            this.#marginLines(this.marginBottom)
            this.newPage();
            tagToAppend = this.currentTag;
        }
        this.charOnLineCounter = 0;
    }

    #marginLines(count) {
        for (let i = 0; i < count; i++) {
            this.newLine(false);
        }
    }

    #updateLineSpacing() {
        const classPrefix = 'lineHeight'
        this.currentClasses = this.currentClasses.filter(c => !c.startsWith(classPrefix));
        this.currentClasses.push(classPrefix + this.lineHeight);
        const span = document.createElement('span');
        span.className = [this.allTagClass, this.currentClasses].join(' ');
        this.currentTag.appendChild(span);
    }

    #lineSpacing() {
        switch (this.lineHeight) {
            case LineHeight.SINGLE: return 1;
            case LineHeight.ONE_HALF: return 1.5;
            case LineHeight.DOUBLE: return 2;
            default: return 1;
        }
    }

    #isOnNewPage() {
        return this.pageLinesCounter + this.marginBottom >= this.pageLength;
    }
}