const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing post data that has json format//

app.use(function (req, res, next)
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT, DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type') ; next();
 });

const { Pool } = require('pg');
const pool = new Pool({ user: 'ag2417_22_g1', host: '130.237.64.7', database: 'ag2417_22', password: 'ag2417_22_g1_password', port: 5435/* the port has to be a number*/ });


//GeoJSON Nodes
app.get('/api/get_markers_geojson', (req, res) =>
{
    pool.query("SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (lg.geom):: json As geometry, row_to_json ((SELECT l FROM ( SELECT nodes_id,nodes_name) As l)) As properties FROM nodes As lg) As f) As fc;", (err, dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});

//GeoJSON all Cars
app.get('/api/get_cars', (req, res) =>
{
    pool.query("SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (lg.geom):: json As geometry, row_to_json ((SELECT l FROM ( Select uid,id,speed,acceleration ) As l)) As properties FROM  ag2417_22_g1.data As lg where time=20001) As f) As fc;", (err, dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});

//GeoJSON Noice 5 min
app.get('/api/get_noice', (req, res) =>
{
    pool.query("SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (lg.geom):: json As geometry, row_to_json ((SELECT l FROM ( Select id,idreceiver,timestep_t,laeq ) As l)) As properties FROM  ag2417_22_g1.noice As lg) As f) As fc;", (err, dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});

//GeoJSOn Cars b time
app.get('/api/get_cars_time', (req, res) =>
{
    var time=req.query.time;
    var q="SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (lg.geom):: json As geometry, row_to_json ((SELECT l FROM ( Select uid,id,speed,acceleration, type ) As l)) As properties FROM  ag2417_22_g1.data As lg where time="+time+") As f) As fc;"
    pool.query(q, (err,dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});

//GeoJSOn noice by time
app.get('/api/get_noice_time', (req, res) =>
{
    var time=req.query.time;
    var q="SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (lg.geom):: json As geometry, row_to_json ((SELECT l FROM ( Select id,idreceiver,timestep_t,laeq  ) As l)) As properties FROM  ag2417_22_g1.noice As lg where timestep_t="+time+") As f) As fc;"
    pool.query(q, (err,dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});

//GeoJSOn noice around car
app.get('/api/get_noice_time_car', (req, res) =>
{
    var time=req.query.time;
    var carid=req.query.carid;
    var reduction=req.query.reduction;
    var radius=req.query.radius;
    var q="SELECT row_to_json (fc) FROM(SELECT 'FeatureCollection' As type , array_to_json ( array_agg (f))As features FROM(SELECT 'Feature' As type , ST_AsGeoJSON (a.geom):: json As geometry, row_to_json ((SELECT l FROM ( Select a.id, a.timestep_t, a.geom, a.laeq*"+reduction+" as laeq) As l)) As properties FROM  (Select * from ag2417_22_g1.noice Where noice.timestep_t="+time+") as a join (SELECT ST_Buffer(geom::geography,"+radius+", 'quad_segs=8')::geometry as geom from ag2417_22_g1.data Where id='"+carid+"'and time="+time+")as b on st_within(a.geom, b.geom)) As f) As fc;"
    pool.query(q, (err,dbResponse) =>
        {
            if (err) console.log(err); //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.send(dbResponse.rows);
        }
        );
});


//Update Car_Type DB
app.post ('/change_car_type', (req , res) =>
    {
        console.log ('Data recieved:' + JSON.stringify (req.body)
        );
        var q="Update ag2417_22_g1.data Set type = 'veh_passenger_e' Where id = '"+req.body.id+"';;";
        pool.query(q,(err,dbResponse) =>
            {
                if(err)console.log(err);
                res.send(dbResponse.rows);
            }
        );
    }
);



app.use(express.static('public'))

app.get('/home', (req, res) => res.sendFile(__dirname + '/home.html'))
app.get('/aboutus', (req, res) => res.sendFile(__dirname + '/aboutus.html'))
app.listen(port, () => console.log(`Map web application listening on port ${ port }!`))
