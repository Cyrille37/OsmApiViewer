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
            if (isset($options[$k]))
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
         * if :fieldValue not present, :field is a :table primary key value
         * :fieldValue = optional - the value of the field to filter by
         * :childrenTable = optional - the children table to select, linked to table by field '<table>_id'.
         *
         * examples
         * - api.php/db/items/id/4/keysvalue
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
                // ->where($table . '.' . $field, $fieldValue)
                // ->join($childrenTable, array($table . '.id', '=', $childrenTable . '.' . $table . '_id')) ->findArray();
                
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

    /**
     * Just for convenience, if you need a simple grouped keys value database.
     * 
     * @param string $fakedata Create fake data or not (default).
     */
    public function createSimpleKeysValueDB($fakedata=null)
    {
        $sqls = array(
            'DROP TABLE IF EXISTS `keysvalue` ;',
            'DROP TABLE IF EXISTS `items` ;',
            'DROP TABLE IF EXISTS `groups` ;',
            'CREATE TABLE `groups` (
					`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					`guid` VARCHAR(36) NOT NULL,
					`label` VARCHAR,
					UNIQUE (`guid`)
				);',
            'CREATE TABLE `items` (
					`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					`groups_id` INTEGER NOT NULL,
					`label` VARCHAR,
					FOREIGN KEY(groups_id) REFERENCES `groups`(id)
				);',
            'CREATE TABLE `keysvalue` (
					`items_id` KEY NOT NULL,
					`key` VARCHAR NOT NULL,
					`value` BLOB,
					PRIMARY KEY( `items_id`,`key`),
					FOREIGN KEY(items_id) REFERENCES `items`(id)
				);'
        );
        
        if (! empty($fakedata)) {
            $sql_fakedata = array(
                'INSERT INTO groups (id, guid,label) VALUES
                    (1, "6D72550B-9FFE-4A9A-838F-70A84BA4AE64","Premier groupe"),
                    (2, "9B2F39CF-A925-4984-9ABC-D326AA8A9FB9","Un autre groupe"),
                    (3, "A0908D4D-D68B-4203-9F6E-63C7931BCBFF","Un autre groupe")',
                'INSERT INTO items (id, groups_id, label) VALUES
                    (1, 2, "item 1 group 2"),
                    (2, 2, "item 2 group 2"),
                    (3, 3, "item 1 group 3"),
                    (4, 4, "item 1 group 4")',
                'INSERT INTO keysvalue (items_id,key,value) VALUES
                    (1,"K1.1","123"),
                    (1,"K1.2","123"),
                    (2,"K2.1","123"),
                    (2,"K2.2","123"),
                    (3,"K3.1","123"),
                    (4,"K4.1","123")'
            );
            $sqls = array_merge($sqls, $sql_fakedata);
        }
        
        ORM::get_db()->beginTransaction();
        foreach ($sqls as $sql) {
            error_log('EXEC : ' . $sql);
            ORM::get_db()->exec($sql);
        }
        ORM::get_db()->commit();
    }
}
