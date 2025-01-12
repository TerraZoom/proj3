var CName = "planetorbits";

var DEGS = 180/Math.PI;                  // convert radians to degrees
var RADS = Math.PI/180;                  // convert degrees to radians
var EPS  = 1.0e-12;                      // machine error constant

// right ascension, declination coordinate structure
function coord()
{
    ra   = parseFloat("0");              // right ascension [deg]
    dec  = parseFloat("0");              // declination [deg]
    rvec = parseFloat("0");              // distance [AU]
}

// altitude, azimuth coordinate structure
function horizon()
{
    alt = parseFloat("0");               // altitude [deg]
    az  = parseFloat("0");               // azimuth [deg]
}

// orbital element structure
function elem()
{
    a = parseFloat("0");                 // semi-major axis [AU]
    e = parseFloat("0");                 // eccentricity of orbit
    i = parseFloat("0");                 // inclination of orbit [deg]
    O = parseFloat("0");                 // longitude of the ascending node [deg]
    w = parseFloat("0");                 // longitude of perihelion [deg]
    L = parseFloat("0");                 // mean longitude [deg]
}

var pname = new Array("Mercury", "Venus  ", "Sun    ",
                      "Mars   ", "Jupiter", "Saturn ",
                      "Uranus ", "Neptune", "Pluto  ");

// compute ...
function compute() {
    console.log("computing...")
    var myLat = 39.904835;
    var myLon = -105.381363;
    var myUTC = -7;

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var mins = now.getMinutes();
    var secs = now.getSeconds();

    // compute day number for date/time
    var dn = day_number( year, month, day, hour, mins );
    console.log("date: " + dn);
    // open_window("planets");

    // msgWindow.document.writeln("UTC: " + month + "/" + day + "/" + year + "  " + d2(hour) + ":" + d2(mins) + ":" + d2(secs));
    //msgWindow.document.writeln("  days since J2000: " + frealstr(dn, 12, 6));
    //msgWindow.document.writeln("Obs: " + lat2str(lat) + "  " + lon2str(lon));
    //msgWindow.document.writeln("");
    //msgWindow.document.writeln("Object    RA         DEC         ALT         AZ          Distance ");
    //msgWindow.document.writeln("------------------------------------------------------------------");

    var p;
    var obj = new coord();
    var h = new horizon();

    // compute location of objects
    var planetArray = [];
    for (p = 0; p < 9; p++)
    {
        get_coord(obj, p, dn);
        coord_to_horizon(now, obj.ra, obj.dec, myLat, myLon, h);

        // msgWindow.document.write(pname[p] + "  ");
        // msgWindow.document.write(ha2str(obj.ra) + "  ");
        // msgWindow.document.write(dec2str(obj.dec) + "  ");
        // msgWindow.document.write(dec2str(h.alt) + "  ");
        // msgWindow.document.write(degr2str(h.az) + "  ");
        // msgWindow.document.write(frealstr(obj.rvec, 9, 6));
        // msgWindow.document.writeln("");


        planetArray.push(h.az);
    };

    console.log("final array: " + planetArray);
    return planetArray;
    // close_window();
}

// day number to/from J2000 (Jan 1.5, 2000)
function day_number( y, m, d, hour, mins )
{
    var h = hour + mins/60;
    var rv = 367*y
           - Math.floor(7*(y + Math.floor((m + 9)/12))/4)
           + Math.floor(275*m/9) + d - 730531.5 + h/24;
    return rv;
}

// compute RA, DEC, and distance of planet-p for day number-d
// result returned in structure obj in degrees and astronomical units
function get_coord( obj, p, d )
{
    var planet = new elem();
    mean_elements(planet, p, d);
    var ap = planet.a;
    var ep = planet.e;
    var ip = planet.i;
    var op = planet.O;
    var pp = planet.w;
    var lp = planet.L;

    var earth = new elem();
    mean_elements(earth, 2, d);
    var ae = earth.a;
    var ee = earth.e;
    var ie = earth.i;
    var oe = earth.O;
    var pe = earth.w;
    var le = earth.L;

    // position of Earth in its orbit
    var me = mod2pi(le - pe);
    var ve = true_anomaly(me, ee);
    var re = ae*(1 - ee*ee)/(1 + ee*Math.cos(ve));

    // heliocentric rectangular coordinates of Earth
    var xe = re*Math.cos(ve + pe);
    var ye = re*Math.sin(ve + pe);
    var ze = 0.0;

    // position of planet in its orbit
    var mp = mod2pi(lp - pp);
    var vp = true_anomaly(mp, planet.e);
    var rp = ap*(1 - ep*ep)/(1 + ep*Math.cos(vp));

    // heliocentric rectangular coordinates of planet
    var xh = rp*(Math.cos(op)*Math.cos(vp + pp - op) - Math.sin(op)*Math.sin(vp + pp - op)*Math.cos(ip));
    var yh = rp*(Math.sin(op)*Math.cos(vp + pp - op) + Math.cos(op)*Math.sin(vp + pp - op)*Math.cos(ip));
    var zh = rp*(Math.sin(vp + pp - op)*Math.sin(ip));

    if (p == 2)                          // earth --> compute sun
    {
        xh = 0;
        yh = 0;
        zh = 0;
    }

    // convert to geocentric rectangular coordinates
    var xg = xh - xe;
    var yg = yh - ye;
    var zg = zh - ze;

    // rotate around x axis from ecliptic to equatorial coords
    var ecl = 23.439281*RADS;            //value for J2000.0 frame
    var xeq = xg;
    var yeq = yg*Math.cos(ecl) - zg*Math.sin(ecl);
    var zeq = yg*Math.sin(ecl) + zg*Math.cos(ecl);

    // find the RA and DEC from the rectangular equatorial coords
    obj.ra   = mod2pi(Math.atan2(yeq, xeq))*DEGS;
    obj.dec  = Math.atan(zeq/Math.sqrt(xeq*xeq + yeq*yeq))*DEGS;
    obj.rvec = Math.sqrt(xeq*xeq + yeq*yeq + zeq*zeq);
}

// Compute the elements of the orbit for planet-i at day number-d
// result is returned in structure p
function mean_elements( p, i, d )
{
    var cy = d/36525;                    // centuries since J2000

    switch (i)
    {
    case 0: // Mercury
        p.a = 0.38709893 + 0.00000066*cy;
        p.e = 0.20563069 + 0.00002527*cy;
        p.i = ( 7.00487  -  23.51*cy/3600)*RADS;
        p.O = (48.33167  - 446.30*cy/3600)*RADS;
        p.w = (77.45645  + 573.57*cy/3600)*RADS;
        p.L = mod2pi((252.25084 + 538101628.29*cy/3600)*RADS);
        break;
    case 1: // Venus
        p.a = 0.72333199 + 0.00000092*cy;
        p.e = 0.00677323 - 0.00004938*cy;
        p.i = (  3.39471 -   2.86*cy/3600)*RADS;
        p.O = ( 76.68069 - 996.89*cy/3600)*RADS;
        p.w = (131.53298 - 108.80*cy/3600)*RADS;
        p.L = mod2pi((181.97973 + 210664136.06*cy/3600)*RADS);
        break;
    case 2: // Earth/Sun
        p.a = 1.00000011 - 0.00000005*cy;
        p.e = 0.01671022 - 0.00003804*cy;
        p.i = (  0.00005 -    46.94*cy/3600)*RADS;
        p.O = (-11.26064 - 18228.25*cy/3600)*RADS;
        p.w = (102.94719 +  1198.28*cy/3600)*RADS;
        p.L = mod2pi((100.46435 + 129597740.63*cy/3600)*RADS);
        break;
    case 3: // Mars
        p.a = 1.52366231 - 0.00007221*cy;
        p.e = 0.09341233 + 0.00011902*cy;
        p.i = (  1.85061 -   25.47*cy/3600)*RADS;
        p.O = ( 49.57854 - 1020.19*cy/3600)*RADS;
        p.w = (336.04084 + 1560.78*cy/3600)*RADS;
        p.L = mod2pi((355.45332 + 68905103.78*cy/3600)*RADS);
        break;
    case 4: // Jupiter
        p.a = 5.20336301 + 0.00060737*cy;
        p.e = 0.04839266 - 0.00012880*cy;
        p.i = (  1.30530 -    4.15*cy/3600)*RADS;
        p.O = (100.55615 + 1217.17*cy/3600)*RADS;
        p.w = ( 14.75385 +  839.93*cy/3600)*RADS;
        p.L = mod2pi((34.40438 + 10925078.35*cy/3600)*RADS);
        break;
    case 5: // Saturn
        p.a = 9.53707032 - 0.00301530*cy;
        p.e = 0.05415060 - 0.00036762*cy;
        p.i = (  2.48446 +    6.11*cy/3600)*RADS;
        p.O = (113.71504 - 1591.05*cy/3600)*RADS;
        p.w = ( 92.43194 - 1948.89*cy/3600)*RADS;
        p.L = mod2pi((49.94432 + 4401052.95*cy/3600)*RADS);
        break;
    case 6: // Uranus
        p.a = 19.19126393 + 0.00152025*cy;
        p.e =  0.04716771 - 0.00019150*cy;
        p.i = (  0.76986  -    2.09*cy/3600)*RADS;
        p.O = ( 74.22988  - 1681.40*cy/3600)*RADS;
        p.w = (170.96424  + 1312.56*cy/3600)*RADS;
        p.L = mod2pi((313.23218 + 1542547.79*cy/3600)*RADS);
        break;
    case 7: // Neptune
        p.a = 30.06896348 - 0.00125196*cy;
        p.e =  0.00858587 + 0.00002510*cy;
        p.i = (  1.76917  -   3.64*cy/3600)*RADS;
        p.O = (131.72169  - 151.25*cy/3600)*RADS;
        p.w = ( 44.97135  - 844.43*cy/3600)*RADS;
        p.L = mod2pi((304.88003 + 786449.21*cy/3600)*RADS);
        break;
    case 8: // Pluto
        p.a = 39.48168677 - 0.00076912*cy;
        p.e =  0.24880766 + 0.00006465*cy;
        p.i = ( 17.14175  +  11.07*cy/3600)*RADS;
        p.O = (110.30347  -  37.33*cy/3600)*RADS;
        p.w = (224.06676  - 132.25*cy/3600)*RADS;
        p.L = mod2pi((238.92881 + 522747.90*cy/3600)*RADS);
        break;
    default:
        window.alert("function mean_elements() failed!");
    }
}

// compute the true anomaly from mean anomaly using iteration
//  M - mean anomaly in radians
//  e - orbit eccentricity
function true_anomaly( M, e )
{
    var V, E1;

    // initial approximation of eccentric anomaly
    var E = M + e*Math.sin(M)*(1.0 + e*Math.cos(M));

    do                                   // iterate to improve accuracy
    {
        E1 = E;
        E = E1 - (E1 - e*Math.sin(E1) - M)/(1 - e*Math.cos(E1));
    }
    while (Math.abs( E - E1 ) > EPS);

    // convert eccentric anomaly to true anomaly
    V = 2*Math.atan(Math.sqrt((1 + e)/(1 - e))*Math.tan(0.5*E));

    if (V < 0) V = V + (2*Math.PI);      // modulo 2pi

    return V;
}

// converts hour angle in degrees into hour angle string
function ha2str( x )
{
    if ((x < 0)||(360 < x)) window.alert("function ha2str() range error!");

    var ra = x/15;                       // degrees to hours
    var h = Math.floor(ra);
    var m = 60*(ra - h);
    return cintstr(h, 3) + "h " + frealstr( m, 4, 1 ) + "m";
}

// converts declination angle in degrees into string
function dec2str( x )
{
    if ((x < -90)||(+90 < x)) window.alert("function dec2str() range error!");

    var dec = Math.abs(x);
    var sgn = (x < 0) ? "-" : " ";
    var d = Math.floor(dec);
    var m = 60*(dec - d);
    return sgn + cintstr(d, 2) + "° " + frealstr(m, 4, 1) + "'";
}

// return the integer part of a number
function abs_floor( x )
{
    var r;
    if (x >= 0.0) r = Math.floor(x);
    else          r = Math.ceil(x);
    return r;
}

// return an angle in the range 0 to 2pi radians
function mod2pi( x )
{
    var b = x/(2*Math.PI);
    var a = (2*Math.PI)*(b - abs_floor(b));
    if (a < 0) a = (2*Math.PI) + a;
    return a;
}

//
// compute horizon coordinates from ra, dec, lat, lon, and utc
// ra, dec, lat, lon in  degrees
// utc is a time number in seconds
//
// results returned in h : horizon record structure
//
function coord_to_horizon( utc, ra, dec, lat, lon, h )
{
    var lmst, ha, sin_alt, cos_az, alt, az;

    // compute hour angle in degrees
    ha = mean_sidereal_time(utc, lon) - ra;
    if (ha < 0) ha = ha + 360;

    // convert degrees to radians
    ha  = ha*RADS;
    dec = dec*RADS;
    lat = lat*RADS;

    // compute altitude in radians
    sin_alt = Math.sin(dec)*Math.sin(lat) + Math.cos(dec)*Math.cos(lat)*Math.cos(ha);
    alt     = Math.asin(sin_alt);

    // compute azimuth in radians
    // divide by zero error at poles or if alt = 90 deg
    cos_az = (Math.sin(dec) - Math.sin(alt)*Math.sin(lat))/(Math.cos(alt)*Math.cos(lat));
    az     = Math.acos(cos_az);

    // convert radians to degrees
    h.alt = alt*DEGS;
    h.az  = az*DEGS;

    // choose hemisphere
    if (Math.sin(ha) > 0) h.az  = 360 - h.az;
}

//
// "mean_sidereal_time" returns the Mean Sidereal Time in units of degrees.
// Use lon = 0 to get the Greenwich MST.
// East longitudes are positive; West longitudes are negative
//
// returns: time in degrees
//
function mean_sidereal_time( d, lon )
{
    var year   = d.getUTCFullYear();
    var month  = d.getUTCMonth() + 1;
    var day    = d.getUTCDate();
    var hour   = d.getUTCHours();
    var minute = d.getUTCMinutes();
    var second = d.getUTCSeconds();

    if ((month == 1)||(month == 2))
    {
        year  = year - 1;
        month = month + 12;
    }

    var a = Math.floor(year/100);
    var b = 2 - a + Math.floor(a/4);
    var c = Math.floor(365.25*year);
    var d = Math.floor(30.6001*(month + 1));

    // days since J2000.0
    var jd = b + c + d - 730550.5 + day
           + (hour + minute/60.0 + second/3600.0)/24.0;

    // julian centuries since J2000.0
    var jt = jd/36525.0;

    // mean sidereal time
    var mst = 280.46061837 + 360.98564736629*jd
            + 0.000387933*jt*jt - jt*jt*jt/38710000 + lon;

    if (mst > 0.0)
    {
        while (mst > 360.0)
            mst = mst - 360.0;
    }
    else
    {
        while (mst < 0.0)
            mst = mst + 360.0;
    }

    return mst;
}

// convert angle (deg, min, sec) to degrees as real
function dms2real( deg, min, sec )
{
    var rv;
    if (deg < 0) rv = deg - min/60 - sec/3600;
    else         rv = deg + min/60 + sec/3600;
    return rv;
}

// converts angle in degrees into string
function degr2str( x )
{
    var dec = Math.abs(x);
    var sgn = (x < 0) ? "-" : " ";
    var d = Math.floor(dec);
    var m = 60*(dec - d);
    return sgn + cintstr(d, 3) + "° " + frealstr(m, 4, 1) + "'";
}

// converts latitude in signed degrees into string
function lat2str( x )
{
    var dec = Math.abs(x);
    var sgn = (x < 0) ? " S" : " N";
    var d = Math.floor(dec);
    var m = 60*(dec - d);
    return cintstr(d, 3) + "° " + frealstr(m, 4, 1) + "'" + sgn;
}

// converts longitude in signed degrees into string
function lon2str( x )
{
    var dec = Math.abs(x);
    var sgn = (x < 0) ? " W" : " E";
    var d = Math.floor(dec);
    var m = 60*(dec - d);
    return cintstr(d, 3) + "° " + frealstr(m, 4, 1) + "'" + sgn;
}

// format two digits with leading zero if needed
function d2( n )
{
    if ((n < 0)||(99 < n)) return "xx";
    return (n < 10) ? ("0" + n) : n;
}

// UTILITY FUNCTIONS

// initialize date
function initdate()
{
    Now = new Date();
    showdate(Now);
    initdatetimegroup(Now);
    load_latlon();
}

// display the date
function showdate(d)
{
    var winter = new Date(2001, 11, 30); // for northern hemisphere
    var summer = new Date(2001,  5, 30);

    var summer_tz = summer.getTimezoneOffset();
    var winter_tz = winter.getTimezoneOffset();

    var local_dst = (summer_tz == winter_tz) ? false : true;

    if (summer_tz > winter_tz)           // in southern hemisphere
    {
        var tz = summer_tz;              // swap
        summer_tz = winter_tz;
        winter_tz = tz;
    }

    var thisday = (d.getMonth() + 1) + "/";
    thisday    += d.getDate() + "/";
    thisday    += d.getFullYear();

    if ((local_dst == true)&&(summer_tz == d.getTimezoneOffset()))
        thisday += " [DST]";

    calc.thisday.value = thisday;
}

// initialize date, time on form
function initdatetimegroup(d)
{
    calc.month.value  = d2(d.getMonth() + 1);
    calc.day.value    = d2(d.getDate());
    calc.year.value   = d.getFullYear();

    calc.hour.value   = d2(d.getHours());
    calc.minute.value = d2(d.getMinutes());
    calc.second.value = d2(d.getSeconds());
}

// change N/S flags
function north_lat()
{
    if (calc.south.checked == true)
        calc.south.checked = false;
}

// change N/S flags
function south_lat()
{
    if (calc.north.checked == true)
        calc.north.checked = false;
}

// change E/W flags
function east_lon()
{
    if (calc.west.checked == true)
        calc.west.checked = false;
}

// change E/W flags
function west_lon()
{
    if (calc.east.checked == true)
        calc.east.checked = false;
}

// save to cookie after checking for valid data
function save_latlon()
{
    var lat_deg = parseInt(calc.lat_degrees.value);
    var lat_min = parseInt(calc.lat_minutes.value);
    var lon_deg = parseInt(calc.lon_degrees.value);
    var lon_min = parseInt(calc.lon_minutes.value);

    if (isNaN(lat_deg)||(lat_deg < 0)||(lat_deg >=  90)||
        isNaN(lat_min)||(lat_min < 0)||(lat_min >=  60)||
        isNaN(lon_deg)||(lon_deg < 0)||(lon_deg >= 180)||
        isNaN(lon_min)||(lon_min < 0)||(lon_min >=  60))
    {
        return;
    }

    if (calc.south.checked == true) lat_deg = -lat_deg;
    if (calc.west.checked  == true) lon_deg = -lon_deg;
    var latlon = cintstr(lat_deg, 8) + cintstr(lat_min, 8)
               + cintstr(lon_deg, 8) + cintstr(lon_min, 8);

    setCookie(CName, latlon, 365);
}

function load_latlon()
{
    var latlon = getCookie(CName);

    if (!latlon) return;                 // no cookie

    s = latlon.substr( 0, 8);
    lat_deg = parseInt(s);

    s = latlon.substr( 8, 8);
    lat_min = parseInt(s);

    s = latlon.substr(16, 8);
    lon_deg = parseInt(s);

    s = latlon.substr(24, 8);
    lon_min = parseInt(s);

    if (lat_deg < 0)                     // south
    {
        calc.south.checked = true;
        calc.north.checked = false;
        lat_deg = -lat_deg;
    }
    else
    {
        calc.south.checked = false;
        calc.north.checked = true;
    }

    if (lon_deg < 0)                     // west
    {
        calc.west.checked = true;
        calc.east.checked = false;
        lon_deg = -lon_deg;
    }
    else
    {
        calc.west.checked = false;
        calc.east.checked = true;
    }

    calc.lat_degrees.value = lat_deg;
    calc.lat_minutes.value = lat_min;
    calc.lon_degrees.value = lon_deg;
    calc.lon_minutes.value = lon_min;
}

// format an integer
function cintstr( num, width )
{
    var str = num.toString(10);
    var len = str.length;
    var intgr = "";
    var i;

    for (i = 0; i < width - len; i++)    // append leading spaces
        intgr += ' ';

    for (i = 0; i < len; i++)            // append digits
        intgr += str.charAt(i);

    return intgr;
}

function frealstr( num, width, fract )
{
    var str = num.toFixed(fract);
    var len = str.length;
    var real = "";
    var i;

    for (i = 0; i < width - len; i++)    // append leading spaces
        real += ' ';

    for (i = 0; i < len; i++)            // append digits
        real += str.charAt(i);

    return real;
}

// opens a separate browser window
function open_window( name )
{
    msgWindow = window.open("","msgWindow","toolbar=no,status=no,menubar=yes,scrollbars=yes,width=550,height=400,resizable=yes");
    msgWindow.document.open();
    msgWindow.document.writeln("<html><head><title>" + name + "</title></head>");
    msgWindow.document.writeln("<body>");
    msgWindow.document.writeln("<pre>");
}

// closes a separate browser window
function close_window()
{
    msgWindow.document.writeln("<p>");
    msgWindow.document.writeln("All done!");
    msgWindow.document.writeln("</pre>");

//--><!--/LiveInternet-->
<!--/noindex--></center></body></html>");
    msgWindow.document.close();
}

function getCookie( cname )
{
    if (document.cookie.length > 0)
    {
        begin = document.cookie.indexOf(cname+"=");
        if (begin != -1)
        {
            begin += cname.length + 1;
            end = document.cookie.indexOf(";", begin);
            if (end == -1) end = document.cookie.length;
            return unescape(document.cookie.substring(begin, end));
        }
    }
    return null;
}

function setCookie( cname, value, days )
{
    var d = new Date();
    d.setTime(d.getTime() + (days*24*3600*1000));

    document.cookie = cname
                    + "=" + escape(value)
                    + ((days == null) ? "" : "; expires=" + d.toGMTString());
}

function delCookie( cname )
{
    if (getCookie(cname))
    {
        document.cookie = cname + "=" + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}
