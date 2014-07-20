<?php
/**
 * Simple Rest & Json Database access.
 *
 * Require Idiorm to access data http://github.com/j4mie/idiorm
 * Require Slim framework http://slimframework.com
 * 
 * To interact with data before save use hooks (@see self::HOOK_*)
 * 
 * Some urls:
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/id
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/field/value
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/field/value/childrenTable
 * curl -i -H "Accept: application/json" -X POST -d "label=bla bla bla" http://website/some.php/db/table
 * curl -i -H "Accept: application/json" -X PUT -d "label=bla bla bla" http://website/some.php/db/table/id
 * 
 */
if (! class_exists('ORM'))
    die('Require idiorm from http://github.com/j4mie/idiorm');
if (! class_exists('\Slim\Slim'))
    die('Require Slim framework from http://slimframework.com');

class RestDB
{

    const HTTP_CONTENT_TYPE = 'application/json; charset=utf-8';

    const HOOK_CREATE_BEFORE_SAVE = 'restdb.create.before.save';

    const HOOK_UPDATE_BEFORE_SAVE = 'restdb.update.before.save';

    const HOOK_RESTDB_BEFORE_DELETE = 'restdb.before.delete';

    protected $config = array(
        'route_prefix' => '/db',
        'logging' => false
    );

    public function __construct($dsn, $user = null, $password = null, $options = array())
    {
        // ORM::configure('sqlite:' . __DIR__ . '/osmapiviewer.sqlite');
        if ($user != null)
            ORM::configure($dsn, $user, $password);
        else
            ORM::configure($dsn);
        
        foreach ($this->config as $k => $v)
            if( isset($options[$k]) )
                $this->config[$k] = $options[$k];

        if ($this->config['logging']) {
            ORM::configure('logging', $this->config['logging']);
            ORM::configure('logger', function ($log_string, $query_time)
            {
                error_log($log_string . ' in ' . $query_time);
            });
        }
        ORM::configure('error_mode', PDO::ERRMODE_EXCEPTION);
        ORM::configure('return_result_sets', true); // returns result sets
    }

    public function registerRoutes(\Slim\Slim $app)
    {
        /**
         * Retreive table rows
         * :table = the table to select
         * :field = optional - the name of the field to filter by -
         *      if :fieldValue not present, :field is a :table primary key value
         * :fieldValue = optional - the value of the field to filter by
         * :childrenTable = optional - the children table to select, linked to table by field '<table>_id'.
         */
        $app->get($this->config['route_prefix'] . '/:table(/:field)(/:fieldValue)(/:childrenTable)', function ($table, $field = null, $fieldValue = null, $childrenTable = null) use($app)
        {
            $result = null;
            /**
             * Search for children table rows
             */
            if ($childrenTable != null) {
                
                // Do not need a join...
                // $result = ORM::for_table($table) ->select( $childrenTable . '.*')
                //  ->where($table . '.' . $field, $fieldValue)
                //  ->join($childrenTable, array($table . '.id', '=', $childrenTable . '.' . $table . '_id')) ->findArray();

                $result = ORM::for_table($childrenTable)->where($childrenTable . '.' . $table . '_id', $fieldValue)
                    ->find_array();
            /**
             * Search for table rows
             */
            } elseif ($fieldValue != null) {
                $result = ORM::for_table($table)->where($field, $fieldValue)
                    ->findArray();
            /**
             * Retreive a field by primary key
             */
            } elseif ($field != null) {
                $result = ORM::for_table($table)->findOne($field)
                    ->asArray();
            /**
             * Return all table rows
             */
            } else {
                $result = ORM::forTable($table)->findArray();
            }
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($result);
        });
        
        /**
         * Create a group
         */
        $app->post($this->config['route_prefix'] . '/:tableName', function ($tableName) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $obj = ORM::forTable($tableName)->create();
            
            foreach ($app->request->post() as $k => $v) {
                $obj->$k = $v;
            }
            
            $app->applyHook(self::HOOK_CREATE_BEFORE_SAVE, $tableName, $obj);
            $obj->save();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($obj->asArray());
        });
        
        /**
         * Update a group
         */
        $app->put($this->config['route_prefix'] . '/db/:tableName/:id', function ($tableName, $id) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $obj = ORM::forTable($tableName)->findOne($id);
            if ($obj === false) {
                $app->notFound();
            }
            foreach ($app->request->post() as $k => $v) {
                $obj->$k = $v;
            }
            
            $app->applyHook(self::HOOK_UPDATE_BEFORE_SAVE, $tableName, $obj);
            $obj->save();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($obj->asArray());
        });
        
        /**
         * Delete a group
         */
        $app->delete($this->config['route_prefix'] . '/db/:tableName/:id', function ($tableName, $id) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $group = ORM::forTable($tableName)->findOne($id);
            if ($group === false) {
                $app->notFound();
            }
            
            $app->applyHook(self::HOOK_RESTDB_BEFORE_DELETE, $tableName, $obj);
            $group->delete();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok();
        });
    }
}
