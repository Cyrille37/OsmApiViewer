<?php

class JsonResponse
{

    public static function Ok($data = null)
    {
        return json_encode(array(
            'result' => 'OK',
            'data' => $data
        ));
    }

    public static function Error($data = null)
    {
        if ($data instanceof \Exception) {
            $data = array(
                'msg' => $data->getMessage(),
                'code' => $data->getCode(),
                'file' => $data->getFile(),
                'line' => $data->getLine()
            );
        }
        return json_encode(array(
            'result' => 'ERROR',
            'data' => $data
        ));
    }
}
