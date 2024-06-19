// TODOS:
// - pictures
// - linespacing on normal font
// - page numbering (first page must be set after header initialization)
// - header and footer
// - control chars 1A, 8D, AD, FE


const tcode = {
    KEYBCS2: 0,
    LATIN2: 1,
    KOI8CS: 2
};

const conv2UTF = {  
    0: { // latin mode (default)                                        
        [tcode.KEYBCS2]: "⌂ČüéďäĎŤčěĚĹÍľĺÄÁÉžŽôöÓůÚýÖÜŠĽÝŘťáíóúňŇŮÔšřŕŔ¼§«»ÇÇù│┤ß£ÆØÅæøå  ┐└┴┬├─┼¤òì₧¡Ñ¿ñèˇ½       à┘┌█▄´°▀αβΓπ∑σµτΦΘΩδ∞øε∩≡±≥≤⌠⌡÷≈ºÀˆ√˝²  ",
        [tcode.LATIN2] : "⌂Çüéùäůè£ÆØÅæøÄÄåÉĹĺôöĽľ òÖÜŤťì₧čáíóú¡ÑŽž¿ñ∑σČ‒«»τ  │┤Á Ě    ≡±≥┐└┴┬├─┼≤⌠⌡≈º√²½¼¤αβĎΓďŇÍπě┘┌█▄µŮ▀ÓßÔΦΘňŠšŔÚŕΩýÝδ∞ø˝εˇ∩§÷à´°ÀˆŘř  ",
        [tcode.KOI8CS] : "⌂Çùè§ß£ÆØÅæøå ¤¤òì₧¡Ñ¿ñ█▄▀       ≡±≥≤⌠⌡÷≈º√²½¼‒«»αβΓπ∑σµτΦΘΩδ∞øε∩┌á└čďěŕ─üíůĺľöňóôäřšťú├éàýž┬ˇ´°┼┐Á┘ČĎĚŔ│ÜÍŮĹĽÖŇÓÔÄŘŠŤÚ┤ÉÀÝŽ┴˝ˆ  ",
    },
    1: { // cyrillic mode (when t602 executed with /r switch)
        [tcode.KEYBCS2]: "⌂ČüéďäĎŤčěĚĹÍľĺÄÁÉžŽôöÓůÚýÖÜŠĽÝŘťáíóúňŇŮÔšřŕŔк§лмББВ│┤ßДЁЖЗИЙК  ┐└┴┬├─┼ЛМНПРТУФГˇйЦЧШЩЪЫЬà┘┌█▄´°▀нпртуфцчшщъыьэюяЭЮЯбвгдёжÀˆз˝и  ",
        [tcode.LATIN2]:  "⌂БüéВäůГДЁЖЗИЙÄÄКÉĹĺôöĽľ МÖÜŤťНПčáíóúРТŽžУФуфČ‒лмчЦЧ│┤ÁШĚЩЪЫЬЭЮЯ┐└┴┬├─┼бвгёжзийкЛнпĎрďŇÍтě┘┌█▄цŮ▀ÓßÔшщňŠšŔÚŕъýÝыьэ˝юˇя§дà´°ÀˆŘř  ",
        [tcode.KOI8CS]:  "⌂БВГ§ßДЁЖЗИЙК ЛЛМНПРТУФ█▄▀ЦЧШЩЪЫЬЭЮЯбвгдёжзийк‒лмнпртуфцчшщъыьзюя┌á└čďěŕ─üíůĺľöňóôäřšťú├éàýž┬ˇ´°┼┐Á┘ČĎĚŔ│ÜÍŮĹĽÖŇÓÔÄŘŠŤÚ┤ÉÀÝŽ┴˝ˆ  ",
    }
}


function processLine(line, documentWriter) {
    
    if (line.length > 2 && String.fromCharCode(line[0]) === '@') {
        let fullCmd = line.map(c => String.fromCharCode(c)).join('');
        let cmd = fullCmd.substring(1, 3);
        let param = fullCmd.length > 3 ? fullCmd.substring(4) : null;
        
        try {
            processCmd(cmd, param, documentWriter);
        } catch (e) {
            console.warn(e.message);
            processText(line, documentWriter);
        }
    } else if (line.length > 0 && String.fromCharCode(line[0]) === '.') {
        let fullCmd = line.map(c => String.fromCharCode(c)).join('');
        let cmd = /^\.(\w+)/.exec(fullCmd)[1];
        let param = fullCmd.substring(cmd.length + 1);
        try {
            processDotCmd(cmd, param, documentWriter);
        } catch (e) {
            console.warn(e.message);
            processText(line, documentWriter);
        }
    } else {
        processText(line, documentWriter);
    }
}

function processCmd(cmd, param, documentWriter) {
    const cmds = {
        'MT': (param) => documentWriter.setMarginTop(parseInt(param)),       
        'MB': (param) => documentWriter.setMarginBottom(parseInt(param)),    
        'TB': (param) => documentWriter.setTabs(param),                      
        'CT': (param) => documentWriter.setCharTable(parseInt(param)),       
        'PN': (param) => documentWriter.setFirstPageNumber(parseInt(param)), 
        'LH': (param) => documentWriter.setLineHeight(parseInt(param)),      
        'LM': (param) => documentWriter.setLeftMargin(parseInt(param)),      
        'RM': (param) => documentWriter.setRightMargin(parseInt(param)),     
        'PL': (param) => documentWriter.setPageLength(parseInt(param)),      
        'PO': (param) => documentWriter.setPrintLeftMargin(parseInt(param)), 
        'OP': (param) => documentWriter.setPrintOmitPageNumber(),            
        'HE': (param) => documentWriter.setHeader(param),                    
        'FO': (param) => documentWriter.setFooter(param),
        'ST': (param) => cmdIgnore(cmd, param), //??

        'PA': (param) => documentWriter.newPage(),
        'PG': (param) => cmdIgnore(cmd, param), //Page Break?
        'PC': (param) => cmdIgnore(cmd, param), //Page Count?
        'HM': (param) => cmdIgnore(cmd, param),
        'FM': (param) => cmdIgnore(cmd, param),
        'CP': (param) => cmdIgnore(cmd, param),
        'KP': (param) => cmdIgnore(cmd, param),
        'IX': (param) => cmdIgnore(cmd, param),
        'PI': (param) => cmdIgnore(cmd, param),
        'DF': (param) => cmdIgnore(cmd, param),
        'NT': (param) => cmdIgnore(cmd, param),
        'SV': (param) => cmdIgnore(cmd, param),
        'DV': (param) => cmdIgnore(cmd, param),

    };
    if (cmds[cmd]) {
        cmds[cmd](param);
    } else {
        throw new Error('Unknown command ' + cmd + ' with param ' + param);
    }
}

// known commands:
// .KAP(3.) Some header text
// .ENDTEXT
// .PA
// .STOP.
function processDotCmd(cmd, param, documentWriter) {
    cmd = cmd.toUpperCase();
    const cmds = {
        'KAP': (param) => cmdIgnore(cmd, param),
        'ENDTEXT': (param) => cmdIgnore(cmd, param),
        'PA': (param) => documentWriter.newPage(),
        'STOP': (param) => cmdIgnore(cmd, param),
        'PI': (param) => cmdPicture(param.split(',')),
    };
    if (cmds[cmd]) {
        cmds[cmd](param);
    } else {
        throw new Error('Unknown dot command ' + cmd + ' with param ' + param);
    }
}

function cmdIgnore(cmd, param) {
    console.warn('Ignoring command', cmd, 'with param', param);
}

function cmdPicture(params) {
    console.info('Picture', params);
    let file = params[0];
    let height = params[1];
    let width = params[2];
    let inverse = params.slice(3).includes('i');
    let rotation = params.slice(3).find(p => !isNaN(p)) || 0;

    console.info('Picture', file, height, width, rotation, inverse);
}

function processText(line, documentWriter) {
    for (let i = 0; i < line.length; i++) {
        if (line[i] < 32 || line[i] === 0x8d || line[i] === 0xfe || line[i] === 0xad) {
            processControlChar(line[i], documentWriter);
        } else {
            processChar(line[i], documentWriter);
        }
    }
    documentWriter.newLine();
}

function processChar(ch, documentWriter) {
    documentWriter.writeChar(ch);
}

function processControlChar(ch, documentWriter) {
    switch (ch) {
        case 0x01: styleElite(); break;
        case 0x02: documentWriter.switchStyle('bold'); break;
        case 0x03: styleCondensed(); break;
        case 0x04: documentWriter.switchStyle('italic');break;
        case 0x09: documentWriter.writeTab(); break;
        case 0x0f: documentWriter.switchStyle('wideFont'); break;
        case 0x10: documentWriter.switchStyle('highFont'); break;
        case 0x11: styleUser1(); break;
        case 0x12: styleUser2(); break;
        case 0x13: documentWriter.switchStyle('underline'); break;
        case 0x14: documentWriter.switchStyle('upperIndex'); break;
        case 0x15: styleUser3(); break;
        case 0x16: documentWriter.switchStyle('lowerIndex'); break;
        case 0x17: styleUser4(); break;
        case 0x18: styleUser5(); break;
        case 0x19: styleUser6(); break;
        case 0x1a: console.info('1A', ch); break;
        case 0x1d: documentWriter.switchStyle('bigFont'); break;
        case 0x8d: console.info('8D', ch); break;
        case 0xad: console.info('AD', ch); break;
        case 0xfe: console.info('FE', ch); break;
        default: console.warn('Unknown control char', ch);
    }
}

function styleCondensed() {
    console.debug('Condensed');
}

function styleElite() {
    console.debug('Elite');
}

function styleUser1() {
    console.debug('User1');
}

function styleUser2() {
    console.debug('User2');
}

function styleUser3() {
    console.debug('User3');
}

function styleUser4() {
    console.debug('User4');
}

function styleUser5() {
    console.debug('User5');
}

function styleUser6() {
    console.debug('User6');
}

document.getElementById('fileInput').addEventListener('change', handleFile, false);

function handleFile(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        var arrayBuffer = event.target.result;
        const cyrillic = document.getElementById('cyrillic').checked;
        const documentWriter = new DocumentWriter(document.getElementById('content'));
        if (cyrillic) {
            documentWriter.enableCyrillic();
        }
        const fileReader = new LineFileReader(arrayBuffer);
        documentWriter.newPage();
        fileReader.readByLine(line => processLine(line, documentWriter));
    };
    reader.readAsArrayBuffer(file);
}

class DocumentWriter {
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
        this.cyrillic = 0;

        this.pageLinesCounter = 0;
        this.charOnLineCounter = 0;
    }

    setCharTable(charTable) { this.charTable = charTable; }
    setTabs(tabs) { this.tabs = tabs; }
    setMarginTop(marginTop) { this.marginTop = marginTop; }
    setMarginBottom(marginBottom) { this.marginBottom = marginBottom; }
    setLeftMargin(leftMargin) { this.leftMargin = leftMargin;}
    setRightMargin(rightMargin) { this.rightMargin = rightMargin; }
    setPageLength(pageLength) { this.pageLength = pageLength; }
    setPrintLeftMargin(printLeftMargin) { this.printLeftMargin = printLeftMargin;}
    setFirstPageNumber(firstPageNumber) { this.firstPageNumber = firstPageNumber; updatePageNumber();}
    setLineHeight(lineHeight) { this.lineHeight = lineHeight; this.updateLineSpacing(); }
    setPrintOmitPageNumber() { this.printOmitPage = true; }
    setHeader(header) { this.header = header; }
    setFooter(footer) { this.footer = footer; }
    enableCyrillic() { this.cyrillic = 1; }


    newPage() {
        const pageClass = 'page'; 

        let copyStyles = null;
        if (this.currentTag.tagName === 'SPAN') {
            console.log('Page number', this.firstPageNumber);
            copyStyles = this.currentTag.className.split(' ').filter(c => c && c !== this.allTagClass);
            copyStyles.forEach(c => this.switchStyle(c));
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
        this.marginLines(this.marginTop);

        if (copyStyles) {
            copyStyles.forEach(c => this.switchStyle(c));
        }
    }

    leftMarginSpaces() {
        return ' '.repeat(this.leftMargin + this.printLeftMargin);
    }

    transChar(ch) {
        if (ch < 32) {
            return ' ';
        } else if (ch < 127) {
            return String.fromCharCode(ch);
        } else {
            return conv2UTF[this.cyrillic][this.charTable][ch - 127];
        }
    }

    switchStyle(className) {
        if (this.currentTag.className.split(' ').includes(className)) {
            this.adjustStyle(this.currentTag);
            this.currentTag = this.currentTag.parentElement;
        } else {
            let span = document.createElement('span');
            span.className = [this.allTagClass, this.currentClasses, className].join(' ');
            this.currentTag.appendChild(span);
            this.currentTag = span;
        }
    }

    adjustStyle(tag) { // adjust width of span of wide and big font
        const w = tag.getBoundingClientRect().width;
        tag.style.width = w + 'px';
    }

    writeChar(ch) {
        this.currentTag.appendChild(document.createTextNode(this.transChar(ch)));
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
        // if we are in span, write the newline after it
        let tagToAppend = this.currentTag;

        if (this.currentTag.tagName === 'SPAN') {
            tagToAppend = this.currentTag.parentElement;
        } 
        tagToAppend.appendChild(document.createElement('br'));
        // prepend left margin to new line
        
        this.pageLinesCounter += this.lineSpacing();
        if (this.isOnNewPage() && createPageOnOverflow) {
            this.marginLines(this.marginBottom)
            this.newPage();
            tagToAppend = this.currentTag;
        }
        tagToAppend.appendChild(document.createTextNode(this.leftMarginSpaces()));
        this.charOnLineCounter = 0;
    }

    marginLines(count) {
        for (let i = 0; i < count; i++) {
            this.newLine(false);
        }
    }

    updateLineSpacing() {
        const classPrefix = 'lineHeight'
        this.currentClasses = this.currentClasses.filter(c => !c.startsWith(classPrefix));
        this.currentClasses.push(classPrefix + this.lineHeight);
        const span = document.createElement('span');
        span.className = [this.allTagClass, this.currentClasses].join(' ');
        this.currentTag.appendChild(span);
    }

    lineSpacing() {
        switch (this.lineHeight) {
            case 6: return 1;
            case 4: return 1.5;
            case 3: return 2;
            default: return 1;
        }
    }

    isOnNewPage() {
        return this.pageLinesCounter + this.marginBottom >= this.pageLength;
    }
}

class LineFileReader {
    constructor(arrayBuffer) {
        this.dataView = new DataView(arrayBuffer);
        this.dataViewPos = 0;
    }

    readChar() {
        try {
            return this.dataView.getUint8(this.dataViewPos++);
        } catch (e) {
            return 0;
        }
    }

    readLine() {
        let line = [];
        let prevCh = 0;
        let ch = this.readChar();
        while (ch !== 10 && ch !== 0) {
            line.push(ch);
            prevCh = ch;
            ch = this.readChar();
        }
        if (prevCh === 13) {
            line.pop();
        }

        return line;
    }

    readByLine(callback) {
        while (this.dataViewPos < this.dataView.byteLength) {
            callback(this.readLine());
        }
    }
    
}
